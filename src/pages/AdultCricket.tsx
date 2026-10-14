import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, MapPin, Medal, Repeat, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { formatPence, type Product } from '@/lib/members';
import { CONTACT_EMAIL, CURRENT_SEASON, DIRECTIONS_URL } from '@/config/club';
import { usePageMeta } from '@/hooks/usePageMeta';

// =================================================================
// EDIT THIS: everything people read on the Adult Cricket page.
// Replace anything in [square brackets] with your real details.
// =================================================================
const ADULTS = {
  teams: [
    {
      icon: <Trophy />,
      name: 'Saturday league',
      detail: "Three men's sides in the Saturday league, so there is a standard of cricket to suit most players.",
      when: 'Saturdays',
    },
    {
      icon: <Zap />,
      name: 'Wednesday T20',
      detail: "Two men's sides in the T20 league. Fast, fun and over in an evening.",
      when: 'Wednesday evenings',
    },
    {
      icon: <Users />,
      name: "Women's cricket",
      detail: "Our women's team plays tournaments throughout the year and is always keen to welcome new players, whatever their experience.",
      when: 'Tournaments throughout the year',
    },
  ],
  training: [
    { label: "Tuesday evenings (men's and women's)", when: 'From 6pm' },
  ],
  kitToBorrow: true, // set to false if players need their own bat, pads etc.
  availability: '[Our captains collect availability each week through the club app.]',
};

const enquiry = (subject: string, body: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const PLAY_LINK = enquiry(
  'Playing adult cricket at KBCC',
  "Hi,\n\nI'm interested in playing cricket at KBCC. Could you tell me more please?\n\nName:\nHave you played before? (if so, where and roughly what level):\nWhich teams interest you (Saturday league, Wednesday T20, women's):\n\nThanks,\n",
);

const AdultCricket = () => {
  usePageMeta({
    title: "Adult cricket: Saturday league, T20 and women's | Kingston Bagpuize CC",
    description: "Three Saturday league sides, two Wednesday T20 sides and women's tournaments. Training Tuesdays from 6pm. New and returning players welcome.",
  });
  const [memberships, setMemberships] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      ?.from('products')
      .select('*')
      .eq('category', 'membership')
      .eq('season', CURRENT_SEASON)
      .eq('age_group', 'Adult')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => setMemberships((data as Product[]) ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Adult cricket at Kingston Bagpuize</h1>
            <p className="text-xl text-primary-foreground/85 mb-8 max-w-xl">
              Saturday league, Wednesday T20 and women's cricket. Whether you're chasing promotion, coming back after years
              away or picking up a bat for the first time, there's a team for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" variant="secondary" className="text-base">
                <a href={PLAY_LINK}><Mail /> I'd like to play</a>
              </Button>
              <Button asChild size="lg" variant="outline"
                      className="text-base bg-transparent text-primary-foreground border-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/matches">See fixtures</Link>
              </Button>
            </div>
          </div>
          <img src="/images/adults-batting-1280.jpg" srcSet="/images/adults-batting-640.jpg 640w, /images/adults-batting-1280.jpg 1280w" sizes="(min-width: 1024px) 50vw, 100vw" width="1280" height="586" alt="Kingston Bagpuize batter driving through the off side"
               className="w-full rounded-2xl shadow-xl object-cover aspect-[16/9]" />
        </div>
      </section>

      {/* Teams */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-3 text-center">Our teams</h2>
          <p className="text-lg text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Over 180 fixtures a season, so you can play as much or as little as you like.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {ADULTS.teams.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground [&_svg]:h-6 [&_svg]:w-6">
                    {t.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{t.name}</h3>
                </div>
                <p className="text-muted-foreground mb-3">{t.detail}</p>
                <p className="text-sm font-medium text-primary">{t.when}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team photo */}
      <section className="pb-16">
        <figure className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <img src="/images/adults-team-airey-cup-2026-1280.jpg" srcSet="/images/adults-team-airey-cup-2026-640.jpg 640w, /images/adults-team-airey-cup-2026-1280.jpg 1280w" sizes="(min-width: 1024px) 1024px, 100vw" width="1280" height="835" loading="lazy" decoding="async" alt="Kingston Bagpuize team photo before the Airey Cup final"
               className="w-full rounded-2xl shadow-lg" />
          <figcaption className="text-sm text-muted-foreground text-center mt-3">Airey Cup final, 31 August 2026</figcaption>
        </figure>
      </section>

      {/* Whoever you are */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">Whatever your cricket looks like</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <Point icon={<Medal />} title="Competitive players">
              Five league titles in 2025 and plenty of ambition. If you want serious cricket, talk to us about our league sides.
            </Point>
            <Point icon={<Repeat />} title="Coming back to the game">
              Not played since school or university? Our lower league sides are a great way back in.
            </Point>
            <Point icon={<Sparkles />} title="New to cricket">
              Never played? Come to training, learn the basics and get a game when you're ready. Everyone starts somewhere.
            </Point>
          </div>
        </div>
      </section>

      {/* Training + membership */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">Training</h2>
              <ul className="space-y-3 mb-4">
                {ADULTS.training.map((t) => (
                  <li key={t.label} className="flex justify-between gap-4 border-b border-border pb-3">
                    <span className="font-medium">{t.label}</span>
                    <span className="text-muted-foreground text-right">{t.when}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">
                New players are welcome to come along to training before joining. Just let us know you're coming.
              </p>
            </div>
            <div className="flex gap-3">
              <MapPin className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">The Sportsfield, Abingdon Road (A415), Kingston Bagpuize, OX13 5GD</p>
                <p className="text-muted-foreground mb-1">Voted one of the top five grounds in Oxfordshire by visiting teams.</p>
                <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Get directions</a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 md:p-8 self-start">
            <h2 className="text-3xl font-bold mb-4">{CURRENT_SEASON} membership</h2>
            {memberships.length > 0 ? (
              <ul className="space-y-3 mb-5">
                {memberships.map((m) => (
                  <li key={m.id} className="flex justify-between gap-4">
                    <span>
                      <span className="font-medium">{m.name.replace(/ \d{4}$/, '')}</span>
                      {m.description && <span className="block text-sm text-muted-foreground">{m.description}</span>}
                    </span>
                    <strong className="shrink-0">{formatPence(m.price_pence)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mb-5">Playing, social, women's and student memberships are available.</p>
            )}
            {memberships.some((m) => m.unlocks_family_rate) && (
              <p className="text-sm text-muted-foreground mb-5">
                Got children who play too? A playing membership gets your first child the reduced junior rate.
                {' '}<Link to="/juniors" className="text-primary underline underline-offset-2">Junior cricket</Link>
              </p>
            )}
            <Button asChild size="lg" className="w-full"><Link to="/members">Join online</Link></Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">Takes a couple of minutes. Pay by card, Apple Pay or Google Pay.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Questions people ask</h2>
          <Accordion type="single" collapsible className="bg-background rounded-xl border border-border px-6">
            <Faq q="I haven't played for years. Will I be out of my depth?">
              Not at all. With three Saturday sides, two T20 sides and women's cricket there's a level for everyone, and plenty of people return to the game after a long break.
            </Faq>
            <Faq q="Do I need my own kit?">
              {ADULTS.kitToBorrow
                ? "Not to start with. The club has bats, pads and helmets you can borrow while you decide if it's for you. You'll want whites for matches."
                : "You'll need your own whites and ideally a bat and pads. Ask us and we can point you towards good-value kit."}
            </Faq>
            <Faq q="How do I get picked for a team?">
              {ADULTS.availability} Come to training, let the captains know when you're free, and you'll get games.
            </Faq>
            <Faq q="Can I just play the odd game?">
              Of course. Plenty of members play a handful of games a season. Play as much or as little as suits you.
            </Faq>
            <Faq q="I don't want to play. Can I still be involved?">
              Yes! Social membership is for supporters, families and anyone who enjoys the club. We're also always grateful for help with
              scoring, umpiring, teas and the ground.
            </Faq>
          </Accordion>
          <p className="text-center text-muted-foreground mt-6">
            Anything else? <a href={PLAY_LINK} className="text-primary underline underline-offset-2">Drop us an email</a>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Fancy a game?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Send us a quick email and come along to training. We'd love to see you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg"><a href={PLAY_LINK}><Mail /> I'd like to play</a></Button>
            <Button asChild size="lg" variant="outline"><Link to="/members">Already decided? Join here</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

function Point({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="text-center md:text-left">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={q} className="last:border-b-0">
      <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">{q}</AccordionTrigger>
      <AccordionContent className="text-muted-foreground text-base">{children}</AccordionContent>
    </AccordionItem>
  );
}

export default AdultCricket;
