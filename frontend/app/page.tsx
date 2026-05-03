'use client';

import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Tariffs from './components/Tariffs';
import Statuses from './components/Statuses';
import Business from './components/Business';
import SendForm from './components/SendForm';
import RecentDeliveries from './components/RecentDeliveries';
import Footer from './components/Footer';
import CrawlingCockroaches from './components/CrawlingCockroaches';

export default function Page() {
  const [chosenTariff, setChosenTariff] = useState<string>('bug_pro');

  const handleChoose = (code: string) => {
    setChosenTariff(code);
    const el = document.getElementById('send');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen">
      <CrawlingCockroaches />
      <Header />
      <Hero />
      <HowItWorks />
      <Tariffs onChoose={handleChoose} />
      <Statuses />
      <Business />
      <SendForm selectedTariff={chosenTariff} />
      <RecentDeliveries />
      <Footer />
    </main>
  );
}
