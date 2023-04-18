export default function LogoMark({ className }) {
  return (
    <a href='https://huwroberts.net' aria-label='Made by Huw Roberts'>
      <svg className={className} xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 100 100'>
        <path stroke='#EFEEEB' strokeWidth='6' d='M3 3h94v94H3z' />
        <path fill='#EFEEEB' d='M59.4 32v15.2H40.45V32H34v35.25h6.45V52.8H59.4v14.45h6.4V32h-6.4Z' />
      </svg>
    </a>
  );
}
