import DayNightToggle from './DayNightToggle';

export default function Nav() {
  return (
    <nav className="nav">
      <a className="logo" href="#top" data-hit>
        yejun<span>.</span>
      </a>
      <ul>
        <li><a className="link" href="#projects">Projects</a></li>
        <li><a className="link" href="#contact">Contact</a></li>
        <li className="keep"><DayNightToggle /></li>
      </ul>
    </nav>
  );
}
