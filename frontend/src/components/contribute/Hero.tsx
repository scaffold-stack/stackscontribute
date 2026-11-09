"use client";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__veil" aria-hidden />
      <div className="hero__content">
        <p className="brand">StacksContribute</p>
        <h1>Fund what matters with open STX gifts.</h1>
        <p className="lede">
          Anyone can start a cause. Anyone can donate — creators included. No gates, just Stacks.
        </p>
        <div className="hero__actions">
          <a className="btn-primary" href="#create">
            Create a cause
          </a>
          <a className="btn-ghost" href="#causes">
            Browse causes
          </a>
        </div>
      </div>
    </section>
  );
}
