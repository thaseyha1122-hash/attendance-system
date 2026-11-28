import clsx from 'clsx'

export default function CountryFlag({ code = 'en', className = '' }) {
  const isKhmer = code === 'km' || code === 'kh' || code === 'fi-kh'

  if (isKhmer) {
    return (
      <svg
        viewBox="0 0 640 480"
        aria-hidden="true"
        className={clsx(
          'inline-block h-4 w-5.5 shrink-0 overflow-hidden rounded-[3px] shadow-2xs ring-1 ring-slate-900/15 dark:ring-white/15',
          className,
        )}
      >
        <path fill="#032ea1" d="M0 0h640v480H0z" />
        <path fill="#e00025" d="M0 120h640v240H0z" />
        <g fill="#fff" stroke="#000" strokeWidth="1.3" strokeLinejoin="round">
          <path d="M156 333h328v11H156z" />
          <path d="M168 322h304v11H168z" />
          <path d="M180 311h280v11H180z" />
          <path d="M192 276h256v35H192z" />
          <path d="M214 235h44v41h-44z" />
          <path d="M218 214h36l-4-17h-28z" />
          <path d="M224 197h24l-5-16h-14z" />
          <path d="M231 181h10l-5-20z" />
          <path d="M382 235h44v41h-44z" />
          <path d="M386 214h36l-4-17h-28z" />
          <path d="M392 197h24l-5-16h-14z" />
          <path d="M399 181h10l-5-20z" />
          <path d="M292 218h56v58h-56z" />
          <path d="M297 195h46l-5-20h-36z" />
          <path d="M304 175h32l-6-19h-20z" />
          <path d="M312 156h16l-8-26z" />
          <path d="M258 258h34v18h-34zM348 258h34v18h-34z" />
          <g fill="#e00025" stroke="none">
            <path d="M204 285h10v26h-10zm24 0h10v26h-10zm24 0h10v26h-10zm24 0h10v26h-10zm36-6h16v32h-16zm32 6h10v26h-10zm24 0h10v26h-10zm24 0h10v26h-10zm24 0h10v26h-10z" />
            <path d="M231 247h10v22h-10zm84-10h10v30h-10zm84 10h10v22h-10z" />
          </g>
          <path d="M226 311h20v33h-20zm82-6h24v39h-24zm86 6h20v33h-20z" />
        </g>
      </svg>
    )
  }

  // Authentic US / English Flag with real 5-pointed stars
  const starRows = [
    { y: 26, cols: [30, 88, 146, 204, 262, 320] },
    { y: 50, cols: [59, 117, 175, 233, 291] },
    { y: 74, cols: [30, 88, 146, 204, 262, 320] },
    { y: 98, cols: [59, 117, 175, 233, 291] },
    { y: 122, cols: [30, 88, 146, 204, 262, 320] },
    { y: 146, cols: [59, 117, 175, 233, 291] },
    { y: 170, cols: [30, 88, 146, 204, 262, 320] },
    { y: 194, cols: [59, 117, 175, 233, 291] },
    { y: 218, cols: [30, 88, 146, 204, 262, 320] },
  ]

  return (
    <svg
      viewBox="0 0 640 480"
      aria-hidden="true"
      className={clsx(
        'inline-block h-4 w-5.5 shrink-0 overflow-hidden rounded-[3px] shadow-2xs ring-1 ring-slate-900/15 dark:ring-white/15',
        className,
      )}
    >
      <path fill="#bd3d44" d="M0 0h640v480H0z" />
      <path
        stroke="#fff"
        strokeWidth="37"
        d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"
      />
      <path fill="#192f5d" d="M0 0h350v258.5H0z" />
      <g fill="#fff">
        {starRows.map((row) =>
          row.cols.map((cx) => (
            <polygon
              key={`${row.y}-${cx}`}
              transform={`translate(${cx}, ${row.y}) scale(1.15)`}
              points="0,-10 2.9,-3.1 9.5,-3.1 4.2,1.2 6.2,8.1 0,4 -6.2,8.1 -4.2,1.2 -9.5,-3.1 -2.9,-3.1"
            />
          )),
        )}
      </g>
    </svg>
  )
}
