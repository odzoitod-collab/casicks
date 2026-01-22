import React from 'react';
import { INFO_TEXT } from '../constants';
import { ShieldCheck, Info } from 'lucide-react';

const InfoBlock: React.FC = () => {
  return (
    <div className="px-4 py-8 bg-slate-900 text-slate-400 text-sm leading-relaxed space-y-8 pb-24">
      {/* Introduction */}
      <section>
        <h2 className="text-xl font-bold text-white mb-3">{INFO_TEXT.title}</h2>
        <p className="mb-3">{INFO_TEXT.intro}</p>
        <p className="mb-3">{INFO_TEXT.licenseInfo}</p>
        <p>{INFO_TEXT.appInfo}</p>
      </section>

      {/* Main Table */}
      <section className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
          <Info size={16} className="text-red-500" />
          <h3 className="font-bold text-white text-sm">Основная информация</h3>
        </div>
        <div className="divide-y divide-slate-700">
          {INFO_TEXT.tableData.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 p-3 gap-2">
              <div className="col-span-1 font-semibold text-slate-300 text-xs">{item.label}</div>
              <div className="col-span-2 text-xs text-slate-400">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Sections */}
      {INFO_TEXT.sections.map((section, idx) => (
        <section key={idx}>
          <h3 className="text-lg font-bold text-white mb-2">{section.title}</h3>
          <p className="text-justify">{section.content}</p>
        </section>
      ))}

      {/* Additional Features List */}
      <section>
        <h3 className="text-lg font-bold text-white mb-2">Безналичные платежи</h3>
        <p className="mb-2">Pin-Up поддерживает широкий спектр платежных инструментов для России:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Банковские карты VISA, MasterCard, МИР</li>
          <li>Интернет-банкинг Сбербанк, Тинькофф, Альфа</li>
          <li>Система быстрых платежей (СБП)</li>
          <li>Пополнение через терминалы самообслуживания</li>
        </ul>
        <p className="text-justify">
          Операции осуществляются в разделе «Касса». Чтобы внести депозит, достаточно указать сумму и подтвердить платеж — реквизиты карты автоматически закрепятся за аккаунтом.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2">Защита данных</h3>
        <div className="flex gap-3 items-start p-3 bg-green-900/10 border border-green-900/30 rounded-lg">
          <ShieldCheck className="text-green-500 shrink-0 mt-1" size={20} />
          <p className="text-xs text-green-100/70">
            Сайт казино онлайн использует 128-битное шифрование, серверы оборудованы антифрод-системой и антивирусным ПО, а карточные платежи соответствуют стандарту PCI DSS.
          </p>
        </div>
      </section>
      
      <section className="text-center pt-6 border-t border-slate-800">
         <p className="text-[10px] text-slate-600 uppercase">Лицензия от 26.02.2021 г.</p>
         <p className="text-[10px] text-slate-600">Только для лиц старше 18 лет</p>
      </section>
    </div>
  );
};

export default InfoBlock;