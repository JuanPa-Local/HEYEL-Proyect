import heyelMark from '../../assets/heyel-mark.png';

export default function Brand() {
  return <a className="brand" href="#login" aria-label="HEYEL · Tu espacio de salud">
    <img className="brand-mark" src={heyelMark} alt="" width="56" height="56"/>
    <div className="brand-copy"><strong>HEYEL</strong><span>Tu espacio de salud</span></div>
  </a>;
}
