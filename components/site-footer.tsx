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
      <details>
        <summary>Commits missing from your graph?</summary>
        <p>
          Profile graphs count public activity only, so work in private repositories does
          not appear. To include it, open your GitHub profile, click Contribution settings
          above the calendar and turn on Private contributions. Others still only see the
          daily count, never the detail.{" "}
          <a
            href="https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements"
            rel="noreferrer"
            target="_blank"
          >
            GitHub&rsquo;s instructions
          </a>
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
