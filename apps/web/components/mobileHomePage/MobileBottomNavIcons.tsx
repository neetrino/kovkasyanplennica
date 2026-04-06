/**
 * Bottom nav tab icons — single shape per tab; active state only changes colors
 * (matches former nav-*.svg vs nav-*-active.svg pairs).
 */
const NAV_INACTIVE = '#97A2B0';
const NAV_ACTIVE = '#75BF5E';
const NAV_HOME_BAR_ACTIVE = '#C6E3E5';

type NavIconProps = {
  active: boolean;
  className?: string;
};

export function NavHomeIcon({ active, className }: NavIconProps) {
  return (
    <svg
      className={className}
      width={24}
      height={24}
      viewBox="0 0 19 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6.64373 18.7821V15.7152C6.64372 14.9381 7.27567 14.3067 8.05844 14.3018H10.9326C11.7189 14.3018 12.3563 14.9346 12.3563 15.7152V15.7152V18.7732C12.3563 19.4473 12.904 19.9951 13.5829 20H15.5438C16.4596 20.0023 17.3388 19.6428 17.9872 19.0007C18.6356 18.3586 19 17.4868 19 16.5775V7.86585C19 7.13139 18.6721 6.43471 18.1046 5.9635L11.443 0.674268C10.2785 -0.250877 8.61537 -0.220992 7.48539 0.745384L0.967012 5.9635C0.372741 6.42082 0.0175523 7.11956 0 7.86585V16.5686C0 18.4637 1.54738 20 3.45617 20H5.37229C5.69917 20.0023 6.01349 19.8751 6.24547 19.6464C6.47746 19.4178 6.60793 19.1067 6.60792 18.7821H6.64373Z"
        fill={active ? NAV_ACTIVE : NAV_INACTIVE}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.8405 9.88974C5.8405 9.47553 6.17629 9.13974 6.5905 9.13974H12.4097C12.8239 9.13974 13.1597 9.47553 13.1597 9.88974C13.1597 10.304 12.8239 10.6397 12.4097 10.6397H6.5905C6.17629 10.6397 5.8405 10.304 5.8405 9.88974Z"
        fill={active ? NAV_HOME_BAR_ACTIVE : NAV_INACTIVE}
      />
    </svg>
  );
}

export function NavSearchIcon({ active, className }: NavIconProps) {
  const stroke = active ? NAV_ACTIVE : NAV_INACTIVE;
  return (
    <svg
      className={className}
      width={24}
      height={24}
      viewBox="0 0 20.2643 20.722"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="9.73856"
        cy="9.73856"
        r="8.98856"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.9903 16.4571L19.5143 19.972"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavCartIcon({ active, className }: NavIconProps) {
  const stroke = active ? NAV_ACTIVE : NAV_INACTIVE;
  return (
    <svg
      className={className}
      width={24}
      height={24}
      viewBox="0 0 20.0002 19.5417"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.750123 0.750123L2.83012 1.11012L3.79312 12.5831C3.87012 13.5201 4.65312 14.2391 5.59312 14.2361H16.5021C17.3991 14.2381 18.1601 13.5781 18.2871 12.6901L19.2361 6.13212C19.3421 5.39912 18.8331 4.71912 18.1011 4.61312C18.0371 4.60412 3.16412 4.59912 3.16412 4.59912"
        fill="white"
      />
      <path
        d="M0.750123 0.750123L2.83012 1.11012L3.79312 12.5831C3.87012 13.5201 4.65312 14.2391 5.59312 14.2361H16.5021C17.3991 14.2381 18.1601 13.5781 18.2871 12.6901L19.2361 6.13212C19.3421 5.39912 18.8331 4.71912 18.1011 4.61312C18.0371 4.60412 3.16412 4.59912 3.16412 4.59912"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.1251 8.29502H14.8981Z"
        fill="white"
      />
      <path
        d="M12.1251 8.29502H14.8981"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.15442 17.7027C5.45542 17.7027 5.69842 17.9467 5.69842 18.2467C5.69842 18.5477 5.45542 18.7917 5.15442 18.7917C4.85342 18.7917 4.61042 18.5477 4.61042 18.2467C4.61042 17.9467 4.85342 17.7027 5.15442 17.7027Z"
        fill="white"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.4347 17.7027C16.7357 17.7027 16.9797 17.9467 16.9797 18.2467C16.9797 18.5477 16.7357 18.7917 16.4347 18.7917C16.1337 18.7917 15.8907 18.5477 15.8907 18.2467C15.8907 17.9467 16.1337 17.7027 16.4347 17.7027Z"
        fill="white"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavProfileIcon({ active, className }: NavIconProps) {
  const stroke = active ? NAV_ACTIVE : NAV_INACTIVE;
  return (
    <svg
      className={className}
      width={24}
      height={24}
      viewBox="0 0 15.84 19.8703"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.92048 13.246C4.05286 13.246 0.75 13.8308 0.75 16.1727C0.75 18.5146 4.0319 19.1203 7.92048 19.1203C11.7881 19.1203 15.09 18.5346 15.09 16.1936C15.09 13.8527 11.809 13.246 7.92048 13.246Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.92048 9.90571C10.4586 9.90571 12.5157 7.84762 12.5157 5.30952C12.5157 2.77143 10.4586 0.714286 7.92048 0.714286C5.38238 0.714286 3.32429 2.77143 3.32429 5.30952C3.31571 7.83905 5.35952 9.89714 7.8881 9.90571H7.92048Z"
        stroke={stroke}
        strokeWidth="1.42857"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
