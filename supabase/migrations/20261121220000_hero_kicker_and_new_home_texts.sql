alter table public.site_settings add column if not exists hero_kicker text not null default '';
update public.site_settings set
  hero_kicker = 'Finanza quantitativa · Risk management · Derivati',
  hero_title = 'Studio come proteggere e far crescere un patrimonio quando valute, tassi e mercati si muovono insieme.',
  hero_intro = 'Dottore in Economia bancaria e studente magistrale in Economia e Finanza all''Università di Milano-Bicocca, oggi in Erasmus all''Universidad de León. Pubblico paper su risk management, hedging valutario, derivati, crypto e geopolitica.';
