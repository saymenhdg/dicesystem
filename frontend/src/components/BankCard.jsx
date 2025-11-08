import React from 'react';

const BankCard = ({ card, showDetails }) => {
    const maskedNumber = `**** **** **** ${card.number.slice(-4)}`;
    const maskedExpiry = '**/**';
    const maskedCvv = '***';

  return (
    <div className="group [perspective:1000px] w-full h-56">
      <div className="relative w-full h-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-2xl">
        {/* Front */}
        <div className={`absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden] bg-gradient-to-br ${card.color}`}>
          {/* Background blobs */}
          <div className={`absolute -top-5 -right-24 w-[380px] h-[250px] bg-gradient-to-br ${card.color} rounded-tl-[100%]`} />
          <div className={`absolute -top-5 -right-40 w-[380px] h-[250px] bg-gradient-to-br ${card.color} rounded-tl-[100%] opacity-80`} />
          <div className={`absolute -top-5 -right-60 w-[380px] h-[250px] bg-gradient-to-br ${card.color} rounded-tl-[100%] opacity-60`} />
          {/* Glow */}
          <div className="absolute -top-36 -left-16 w-[400px] h-[200px] bg-cyan-400/40 blur-lg rounded-full -skew-x-12 -skew-y-12" />

          {/* Logo SVG */}
          <svg width="72" height="24" viewBox="0 0 72 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-6 top-5">
            <path fillRule="evenodd" clipRule="evenodd" d="M52.3973 1.01093L51.5588 5.99054C49.0448 4.56717 43.3231 4.23041 43.3231 6.85138C43.3231 7.89285 44.6177 8.60913 46.178 9.47241C48.5444 10.7817 51.5221 12.4291 51.5221 16.062C51.5221 21.8665 45.4731 24 41.4645 24C37.4558 24 34.8325 22.6901 34.8325 22.6901L35.7065 17.4848C38.1115 19.4688 45.4001 20.032 45.4001 16.8863C45.4001 15.5645 43.9656 14.785 42.3019 13.8811C40.0061 12.6336 37.2742 11.1491 37.2742 7.67563C37.2742 1.30988 44.1978 0 47.1132 0C49.8102 0 52.3973 1.01093 52.3973 1.01093ZM66.6055 23.6006H72L67.2966 0.414276H62.5732C60.3923 0.414276 59.8612 2.14215 59.8612 2.14215L51.0996 23.6006H57.2234L58.4481 20.1566H65.9167L66.6055 23.6006ZM60.1406 15.399L63.2275 6.72235L64.9642 15.399H60.1406ZM14.7942 16.3622L20.3951 0.414917H26.7181L17.371 23.6012H11.2498L6.14551 3.45825C2.83215 1.41281 0 0.807495 0 0.807495L0.108643 0.414917H9.36816C11.9161 0.414917 12.1552 2.50314 12.1552 2.50314L14.1313 12.9281L14.132 12.9294L14.7942 16.3622ZM25.3376 23.6006H31.2126L34.8851 0.414917H29.0095L25.3376 23.6006Z" fill="white"/>
          </svg>

          {/* Contactless icon */}
          <div className="absolute right-3 top-10 scale-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="46" height="56">
              <path fill="none" stroke="#f9f9f9" strokeWidth="6" strokeLinecap="round" d="m35,3a50,50 0 0,1 0,50M24,8.5a39,39 0 0,1 0,39M13.5,13.55a28.2,28.5 0 0,1 0,28.5M3,19a18,17 0 0,1 0,18" />
            </svg>
          </div>

          {/* Chip */}
          <div className="absolute top-[65px] left-[25px] w-[45px] h-[34px] rounded bg-[#ffda7b] overflow-hidden">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[7%] bg-[#ffda7b] border border-[#a27c1f] w-1/4 h-[110%] rounded-full z-10" />
            <div className="absolute top-[30%] -left-[10%] bg-transparent border border-[#a27c1f] w-[120%] h-[33%]" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 p-6 text-white">
            <div className="absolute left-6 bottom-5 text-xs tracking-widest uppercase opacity-80 drop-shadow">
              {(card.holder || '').toString().toUpperCase()}
            </div>

            <div className="absolute left-6 bottom-[65px] text-[16px] font-semibold tracking-[0.2em] drop-shadow">
              {showDetails ? card.number : maskedNumber}
            </div>

            <div className="absolute right-6 bottom-5 text-sm tracking-widest drop-shadow">
              <span className="absolute -top-4 -left-9 text-[9px]">GOOD THRU</span>
              {showDetails ? card.expiry : maskedExpiry}
            </div>
          </div>
        </div>

        {/* Back */}
        <div className={`absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br ${card.color}`}>
          {/* Stripe */}
          <div className="absolute top-[15%] w-full h-10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950" />

          {/* Back glow */}
          <div className="absolute top-[40%] left-[20%] w-[180%] h-[120%] rounded-full bg-gradient-to-tr from-[#a3d4e7] via-[#8ecae1] to-[#73c3e1] blur-md opacity-20" />

          {/* Signature */}
          <div className="absolute top-[120px] left-[15px] w-[70%] h-[30px] bg-zinc-200 flex items-center justify-center text-slate-900 font-[\'Mr Dafoe\',cursive] text-[28px] sm:text-[32px]">
            {card.holder}
            <span className="absolute -top-4 left-0 font-mono text-[9px] text-zinc-200">Authorized Signature</span>
          </div>

          {/* CVV */}
          <div className="absolute top-[125px] left-[245px] w-[40px] h-[17px] bg-zinc-200 text-slate-900 text-center text-[11px] flex items-center justify-center">
            {showDetails ? card.cvv : maskedCvv}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankCard;
