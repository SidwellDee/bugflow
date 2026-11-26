import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBug, faTableColumns, faListCheck, faChartPie, faPlus, faArrowLeft, faArrowRight, faChevronDown, faChevronLeft, faChevronRight, faFolderOpen, faUsers, faRightFromBracket, faGear, faXmark, faClockRotateLeft, faPenToSquare, faFloppyDisk, faDownload, faEnvelope, faRotate, faGrip, faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
const icons = { bug: faBug, board: faTableColumns, list: faListCheck, chart: faChartPie, plus: faPlus, back: faArrowLeft, forward: faArrowRight, down: faChevronDown, previous: faChevronLeft, next: faChevronRight, projects: faFolderOpen, users: faUsers, logout: faRightFromBracket, settings: faGear, close: faXmark, history: faClockRotateLeft, edit: faPenToSquare, save: faFloppyDisk, download: faDownload, mail: faEnvelope, refresh: faRotate, empty: faGrip, move: faArrowRightArrowLeft, google: faGoogle };
export default function Icon({ name, className = '' }) {
  return <FontAwesomeIcon icon={icons[name]} className={'app-icon ' + className} aria-hidden="true" focusable="false" />;
}
