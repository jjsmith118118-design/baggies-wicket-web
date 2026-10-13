import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Shirt, Users } from 'lucide-react';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { formatPence, type Product } from '@/lib/members';
import { AGE_GROUPS, CONTACT_EMAIL, CURRENT_SEASON, DIRECTIONS_URL } from '@/config/club';

// ---------------------------------------------------------------
// EDIT THIS: junior section details shown on the page.
// Anything in [square brackets] is a placeholder to replace.
// ---------------------------------------------------------------
const JUNIORS = {
  intro:
    'Junior cricket at KBCC is for boys and girls from U9 upwards, whether they have played before or not. ' +
    '[Sessions are run by qualified, DBS-checked coaches] and are all about learning, playing and enjoying the game.',
  training: [
    { group: '[U9 and U11]', when: '[Day], [time]' },
    { group: '[U13 to U18]', when: '[Day], [time]' },
  ],
  season: 'Indoor sessions start in [January]; outdoor training and matches run from April to September.',
  bring: 'Comfortable sports clothes, trainers, a water bottle and sun cream. [The club provides bats, balls and protective kit to borrow.]',
  coaches: '[Head of juniors name]',
  safeguarding: '[Welfare officer name]',
};

const Juniors = () => {
  const [memberships, setMemberships] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      ?.from('products')
      .select('*')
      .eq('category', 'membership')
      .eq('season', CURRENT_SEASON)
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => setMemberships((data as Product[]) ?? []));
  }, []);

  const junior = memberships.filter((m) => m.age_group !== 'Adult');
  const familyRate = memberships.find((m) => m.age_group === 'Adult' && m.unlocks_family_rate);
  const main = junior.find((m) => m.age_group === null) ?? junior[0];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Junior cricket</h1>
            <p className="text-xl text-primary-foreground/85 mb-8">{JUNIORS.intro}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" variant="secondary"><Link to="/members">Register and pay</Link></Button>
              <Button asChild size="lg" variant="outline"
                      className="bg-transparent text-primary-foreground border-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <a href={`mailto:${CONTACT_EMAIL}?subject=Junior%20cricket`}>Ask a question</a>
              </Button>
            </div>
          </div>
          <img src="/lovable-uploads/070ca7f0-f8c8-47f5-b12f-2406b86bda16.png" alt="Kingston Bagpuize CC players in a team huddle"
               className="w-full rounded-lg shadow-lg object-cover hidden lg:block" />
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Age groups</h2>
              <p className="text-muted-foreground mb-3">
                We run {AGE_GROUPS.slice(0, -1).join(', ')} and {AGE_GROUPS[AGE_GROUPS.length - 1]} teams. Age groups follow the ECB rule:
                your child's age on 31 August before the season.
              </p>
              <p className="text-muted-foreground">
                When you add your child in the members area, we work out their age group for you.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><Clock className="h-6 w-6 text-primary" /> Training</h2>
              <ul className="space-y-2 mb-3">
                {JUNIORS.training.map((t) => (
                  <li key={t.group} className="flex justify-between gap-4 border-b border-border pb-2">
                    <span className="font-medium">{t.group}</span>
                    <span className="text-muted-foreground text-right">{t.when}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">{JUNIORS.season}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><Shirt className="h-6 w-6 text-primary" /> What to bring</h2>
              <p className="text-muted-foreground">{JUNIORS.bring}</p>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">{CURRENT_SEASON} subs</h2>
                {main ? (
                  <ul className="space-y-2 mb-4">
                    <li className="flex justify-between"><span>Junior membership</span><strong>{formatPence(main.price_pence)}</strong></li>
                    {main.price_2nd_child_pence && (
                      <li className="flex justify-between"><span>2nd child</span><strong>{formatPence(main.price_2nd_child_pence)}</strong></li>
                    )}
                    {main.price_3rd_child_pence && (
                      <li className="flex justify-between"><span>3rd child and beyond</span><strong>{formatPence(main.price_3rd_child_pence)}</strong></li>
                    )}
                    {junior.filter((m) => m.id !== main.id).map((m) => (
                      <li key={m.id} className="flex justify-between"><span>{m.name.replace(/ \d{4}$/, '')}</span><strong>{formatPence(m.price_pence)}</strong></li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mb-4">See current prices in the members area.</p>
                )}
                {main?.price_2nd_child_pence && familyRate && (
                  <p className="text-sm text-muted-foreground mb-4">
                    If a parent has an {familyRate.name.replace(/ \d{4}$/, '')}, your first child is charged the 2nd-child rate too.
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-5">
                  Pay online in a couple of minutes. Discounts are applied automatically, and you can pay for everyone at once
                  or one child at a time.
                </p>
                <Button asChild className="w-full" size="lg"><Link to="/members">Register and pay</Link></Button>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-2xl font-bold mb-3">Coaching and welfare</h2>
              <p className="text-muted-foreground mb-2">Head of juniors: {JUNIORS.coaches}</p>
              <p className="text-muted-foreground">Welfare officer: {JUNIORS.safeguarding}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" /> Where</h2>
              <p className="text-muted-foreground mb-2">The Sportsfield, Abingdon Road (A415), Kingston Bagpuize, OX13 5GD</p>
              <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get directions</a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Juniors;
