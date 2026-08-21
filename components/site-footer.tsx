export function SiteFooter() {
  return (
    <footer id="about">
      <details>
        <summary>Methodology</summary>
        <p>
          Public non-merge commits from eight recently active repositories. Private work
          is excluded; totals are not productivity scores.
        </p>
      </details>
      <nav className="footer-products" aria-label="Our other products">
        <span>Also from us</span>
        <ul>
          <li>
            <a href="https://tradehand.com">Tradehand</a>
          </li>
          <li>
            <a href="https://outside.so">Outside</a>
          </li>
          <li>
            <a href="https://sentrydock.com">SentryDock</a>
          </li>
          <li>
            <a href="https://toolrouter.com">ToolRouter</a>
          </li>
          <li>
            <a href="https://magicscreenshots.com">Magic Screenshots</a>
          </li>
        </ul>
      </nav>

      <span>GitHub · Updated daily</span>
    </footer>
  );
}
