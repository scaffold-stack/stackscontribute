;; StacksContribute - open causes, open donations
;; Anyone can create a cause. Anyone (including the creator) can donate STX.
;; STX is held in the contract; the cause creator can withdraw anytime (no goal gate).

(define-constant ERR_EMPTY_TITLE (err u100))
(define-constant ERR_EMPTY_DESCRIPTION (err u101))
(define-constant ERR_CAUSE_NOT_FOUND (err u102))
(define-constant ERR_INVALID_AMOUNT (err u103))
(define-constant ERR_UNAUTHORIZED (err u105))
(define-constant ERR_NOTHING_TO_WITHDRAW (err u106))

(define-data-var next-cause-id uint u0)

(define-map causes
  uint
  {
    creator: principal,
    title: (string-utf8 80),
    description: (string-utf8 280),
    goal: uint,
    raised: uint,
    withdrawn: uint,
    donors: uint,
    created-at: uint
  }
)

(define-map donations
  { cause-id: uint, donor: principal }
  uint
)

(define-read-only (get-cause-count)
  (ok (var-get next-cause-id))
)

(define-read-only (get-cause (cause-id uint))
  (ok (map-get? causes cause-id))
)

(define-read-only (get-donation (cause-id uint) (donor principal))
  (ok (default-to u0 (map-get? donations { cause-id: cause-id, donor: donor })))
)

(define-read-only (get-available (cause-id uint))
  (match (map-get? causes cause-id)
    cause (ok (- (get raised cause) (get withdrawn cause)))
    (err u102)
  )
)

(define-public (create-cause
    (title (string-utf8 80))
    (description (string-utf8 280))
    (goal uint)
  )
  (let (
      (cause-id (var-get next-cause-id))
    )
    (asserts! (> (len title) u0) ERR_EMPTY_TITLE)
    (asserts! (> (len description) u0) ERR_EMPTY_DESCRIPTION)
    (map-set causes cause-id {
      creator: tx-sender,
      title: title,
      description: description,
      goal: goal,
      raised: u0,
      withdrawn: u0,
      donors: u0,
      created-at: stacks-block-height
    })
    (var-set next-cause-id (+ cause-id u1))
    (ok cause-id)
  )
)

(define-public (donate (cause-id uint) (amount uint))
  (let (
      (cause (unwrap! (map-get? causes cause-id) ERR_CAUSE_NOT_FOUND))
      (prior (default-to u0 (map-get? donations { cause-id: cause-id, donor: tx-sender })))
      (is-first-donation (is-eq prior u0))
    )
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    ;; Escrow STX in this contract so anyone (including the creator) can donate.
    (try! (stx-transfer? amount tx-sender current-contract))
    (map-set donations { cause-id: cause-id, donor: tx-sender } (+ prior amount))
    (map-set causes cause-id
      (merge cause {
        raised: (+ (get raised cause) amount),
        donors: (if is-first-donation (+ (get donors cause) u1) (get donors cause))
      })
    )
    (ok amount)
  )
)

(define-public (withdraw (cause-id uint))
  (let (
      (cause (unwrap! (map-get? causes cause-id) ERR_CAUSE_NOT_FOUND))
      (available (- (get raised cause) (get withdrawn cause)))
      (creator (get creator cause))
      (recipient tx-sender)
    )
    (asserts! (is-eq tx-sender creator) ERR_UNAUTHORIZED)
    (asserts! (> available u0) ERR_NOTHING_TO_WITHDRAW)
    (try! (as-contract? ((with-stx available))
      (try! (stx-transfer? available current-contract recipient))
    ))
    (map-set causes cause-id (merge cause { withdrawn: (+ (get withdrawn cause) available) }))
    (ok available)
  )
)
