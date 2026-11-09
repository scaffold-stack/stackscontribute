import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

const title = Cl.stringUtf8("Community Garden");
const description = Cl.stringUtf8("Help plant trees in the neighborhood park.");
const goal = Cl.uint(5_000_000); // 5 STX in micro-STX

describe("contribute", () => {
  it("starts with zero causes", () => {
    const { result } = simnet.callReadOnlyFn(
      "contribute",
      "get-cause-count",
      [],
      deployer
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("anyone can create a cause", () => {
    const { result } = simnet.callPublicFn(
      "contribute",
      "create-cause",
      [title, description, goal],
      wallet1
    );
    expect(result).toBeOk(Cl.uint(0));

    const count = simnet.callReadOnlyFn(
      "contribute",
      "get-cause-count",
      [],
      deployer
    );
    expect(count.result).toBeOk(Cl.uint(1));

    const cause = simnet.callReadOnlyFn(
      "contribute",
      "get-cause",
      [Cl.uint(0)],
      deployer
    );
    expect(cause.result).toBeOk(
      Cl.some(
        Cl.tuple({
          creator: Cl.principal(wallet1),
          title,
          description,
          goal,
          raised: Cl.uint(0),
          withdrawn: Cl.uint(0),
          donors: Cl.uint(0),
          "created-at": Cl.uint(simnet.blockHeight),
        })
      )
    );
  });

  it("rejects empty title or description", () => {
    const emptyTitle = simnet.callPublicFn(
      "contribute",
      "create-cause",
      [Cl.stringUtf8(""), description, goal],
      wallet1
    );
    expect(emptyTitle.result).toBeErr(Cl.uint(100));

    const emptyDesc = simnet.callPublicFn(
      "contribute",
      "create-cause",
      [title, Cl.stringUtf8(""), goal],
      wallet1
    );
    expect(emptyDesc.result).toBeErr(Cl.uint(101));
  });

  it("anyone including the creator can donate", () => {
    simnet.callPublicFn(
      "contribute",
      "create-cause",
      [title, description, goal],
      wallet1
    );

    const creatorDonate = simnet.callPublicFn(
      "contribute",
      "donate",
      [Cl.uint(0), Cl.uint(1_000_000)],
      wallet1
    );
    expect(creatorDonate.result).toBeOk(Cl.uint(1_000_000));

    const outsiderDonate = simnet.callPublicFn(
      "contribute",
      "donate",
      [Cl.uint(0), Cl.uint(2_000_000)],
      wallet2
    );
    expect(outsiderDonate.result).toBeOk(Cl.uint(2_000_000));

    const cause = simnet.callReadOnlyFn(
      "contribute",
      "get-cause",
      [Cl.uint(0)],
      deployer
    );
    expect(cause.result).toBeOk(
      Cl.some(
        Cl.tuple({
          creator: Cl.principal(wallet1),
          title,
          description,
          goal,
          raised: Cl.uint(3_000_000),
          withdrawn: Cl.uint(0),
          donors: Cl.uint(2),
          "created-at": Cl.uint(simnet.blockHeight - 2),
        })
      )
    );

    const donation = simnet.callReadOnlyFn(
      "contribute",
      "get-donation",
      [Cl.uint(0), Cl.principal(wallet2)],
      deployer
    );
    expect(donation.result).toBeOk(Cl.uint(2_000_000));
  });

  it("rejects zero amount and missing cause", () => {
    simnet.callPublicFn(
      "contribute",
      "create-cause",
      [title, description, goal],
      wallet1
    );

    const zero = simnet.callPublicFn(
      "contribute",
      "donate",
      [Cl.uint(0), Cl.uint(0)],
      wallet2
    );
    expect(zero.result).toBeErr(Cl.uint(103));

    const missing = simnet.callPublicFn(
      "contribute",
      "donate",
      [Cl.uint(99), Cl.uint(1_000)],
      wallet2
    );
    expect(missing.result).toBeErr(Cl.uint(102));
  });

  it("counts unique donors once across repeat donations", () => {
    simnet.callPublicFn(
      "contribute",
      "create-cause",
      [title, description, goal],
      wallet1
    );

    simnet.callPublicFn(
      "contribute",
      "donate",
      [Cl.uint(0), Cl.uint(500_000)],
      wallet2
    );
    simnet.callPublicFn(
      "contribute",
      "donate",
      [Cl.uint(0), Cl.uint(500_000)],
      wallet2
    );

    const cause = simnet.callReadOnlyFn(
      "contribute",
      "get-cause",
      [Cl.uint(0)],
      deployer
    );
    expect(cause.result).toBeOk(
      Cl.some(
        Cl.tuple({
          creator: Cl.principal(wallet1),
          title,
          description,
          goal,
          raised: Cl.uint(1_000_000),
          withdrawn: Cl.uint(0),
          donors: Cl.uint(1),
          "created-at": Cl.uint(simnet.blockHeight - 2),
        })
      )
    );
  });

  it("only the creator can withdraw raised STX", () => {
    simnet.callPublicFn(
      "contribute",
      "create-cause",
      [title, description, goal],
      wallet1
    );
    simnet.callPublicFn(
      "contribute",
      "donate",
      [Cl.uint(0), Cl.uint(2_000_000)],
      wallet2
    );

    const denied = simnet.callPublicFn(
      "contribute",
      "withdraw",
      [Cl.uint(0)],
      wallet2
    );
    expect(denied.result).toBeErr(Cl.uint(105));

    const ok = simnet.callPublicFn(
      "contribute",
      "withdraw",
      [Cl.uint(0)],
      wallet1
    );
    expect(ok.result).toBeOk(Cl.uint(2_000_000));

    const empty = simnet.callPublicFn(
      "contribute",
      "withdraw",
      [Cl.uint(0)],
      wallet1
    );
    expect(empty.result).toBeErr(Cl.uint(106));

    const available = simnet.callReadOnlyFn(
      "contribute",
      "get-available",
      [Cl.uint(0)],
      deployer
    );
    expect(available.result).toBeOk(Cl.uint(0));
  });
});
