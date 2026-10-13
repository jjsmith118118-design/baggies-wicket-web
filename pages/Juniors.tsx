import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartHandshake, Mail, MapPin, Shirt, Smile, Sparkles } from 'lucide-react';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { ageGroupFor, formatPence, isJunior, type Product } from '@/lib/members';
import { CONTACT_EMAIL, CURRENT_SEASON, DIRECTIONS_URL, JUNIOR_EMAIL } from '@/config/club';

// =================================================================
// EDIT THIS: everything families read on the Juniors page.
// Replace anything in [square brackets] with your real details.
// =================================================================
const JUNIORS = {
  youngestAge: '[8]', // youngest age you take
  tasterSessions: 2, // free sessions before joining; set to 0 if you don't offer any
  kitToBorrow: true, // set to false if children need their own bat, pads etc.
  training: [
    { groups: ['U9', 'U11'], label: 'U9 and U11', when: '[Friday], [6pm to 7pm]' },
    { groups: ['U13', 'U15', 'U18', 'U20'], label: 'U13 and older', when: '[Friday], [7pm to 8.30pm]' },
  ],
  indoorStart: '[January]',
  headOfJuniors: '[Name]',
  welfareOfficer: '[Name]',
};

const enquiryLink = (subject: string, body: string) =>
  `mailto:${JUNIOR_EMAIL}?cc=${encodeURIComponent(CONTACT_EMAIL)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const ASK_LINK = enquiryLink(
  'Junior cricket question',
  "Hi,\n\nI have a question about junior cricket at KBCC.\n\nMy child's name and age:\n\nMy question:\n\nThanks,\n",
);
const TRY_LINK = enquiryLink(
  'Taster session enquiry',
  "Hi,\n\nMy son/daughter is interested in joining the club and doing a taster session. Could you tell me more please?\n\nChild's name and age:\n\nThanks,\n",
);

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

  const juniorSub = memberships.find((m) => m.age_group === null) ?? memberships.find((m) => m.age_group && m.age_group !== 'Adult');
  const familyRate = memberships.find((m) => m.age_group === 'Adult' && m.unlocks_family_rate);
  const taster = JUNIORS.tasterSessions;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Come and play cricket</h1>
            <p className="text-xl text-primary-foreground/85 mb-8 max-w-xl">
              Friendly junior cricket for girls and boys aged {JUNIORS.youngestAge} to 19 in Kingston Bagpuize.
              No experience needed{JUNIORS.kitToBorrow ? ', and no kit to buy' : ''}. Just bring a big smile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" variant="secondary" className="text-base">
                <a href={TRY_LINK}>Try a session</a>
              </Button>
              <Button asChild size="lg" variant="outline"
                      className="text-base bg-transparent text-primary-foreground border-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <a href={ASK_LINK}><Mail /> Ask a question</a>
              </Button>
            </div>
          </div>
          <img src="/lovable-uploads/87b0f990-614a-4670-8520-e81472557d2d.png" alt="Batter playing a shot at Kingston Bagpuize Cricket Club"
               className="w-full rounded-2xl shadow-xl object-cover aspect-[4/3]" />
        </div>
      </section>

      {/* Reassurance */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">New to cricket? You're in the right place</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <Point icon={<Smile />} title="Never played? That's fine">
              Lots of children start with no experience at all. The basics are taught through games, so everyone can join in from day one.
            </Point>
            <Point icon={<HeartHandshake />} title="Girls and boys welcome">
              Cricket is for everyone. Children train in age groups, so they're with others their own age and ability.
            </Point>
            <Point icon={<Shirt />} title={JUNIORS.kitToBorrow ? 'No kit to buy' : 'Easy to get started'}>
              {JUNIORS.kitToBorrow
                ? 'We lend bats, pads, helmets and balls. Just come in trainers and comfy sports clothes.'
                : 'Comfy sports clothes and trainers are all you need for the first session. We can advise on kit later.'}
            </Point>
          </div>
        </div>
      </section>

      {/* Getting started */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">How to get started</h2>
          <ol className="space-y-8">
            <Step n={1} title="Say hello">
              Drop our junior coordinator an email with your child's name and age. We'll tell you which session to come to.{' '}
              <a href={TRY_LINK} className="text-primary underline underline-offset-2">Send an email</a>
            </Step>
            <Step n={2} title={taster > 0 ? `Come along for ${taster === 1 ? 'a free session' : `${taster} free sessions`}` : 'Come along and try it'}>
              Turn up a few minutes early and a coach will meet you. Parents are welcome to stay and watch.
            </Step>
            <Step n={3} title="Join when you're ready">
              If your child enjoys it, register and pay online in a couple of minutes.{' '}
              <Link to="/members" className="text-primary underline underline-offset-2">Members area</Link>
            </Step>
          </ol>
        </div>
      </section>

      {/* Age group + training */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
          <AgeFinder />
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">When and where</h2>
              <ul className="space-y-3 mb-4">
                {JUNIORS.training.map((t) => (
                  <li key={t.label} className="flex justify-between gap-4 border-b border-border pb-3">
                    <span className="font-medium">{t.label}</span>
                    <span className="text-muted-foreground text-right">{t.when}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">
                Indoor sessions start in {JUNIORS.indoorStart}. Outdoor training and matches run from April to September.
              </p>
            </div>
            <div className="flex gap-3">
              <MapPin className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">The Sportsfield, Abingdon Road (A415), Kingston Bagpuize, OX13 5GD</p>
                <p className="text-muted-foreground mb-1">Parking available at the ground.</p>
                <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Get directions</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Questions parents ask</h2>
          <Accordion type="single" collapsible className="bg-background rounded-xl border border-border px-6">
            <Faq q="What should my child bring?">
              Trainers, comfortable sports clothes, a water bottle and sun cream in summer.
              {JUNIORS.kitToBorrow && ' We provide all the cricket equipment.'}
            </Faq>
            <Faq q="Do they need to buy cricket whites?">
              Not to start with. Whites are only needed for matches, and the coaches will let you know when matches are happening.
            </Faq>
            <Faq q="What if we can't make every week?">
              That's absolutely fine. Come when you can. Children get the most out of it with regular sessions, but there's no pressure.
            </Faq>
            <Faq q="Who runs the sessions?">
              Sessions are led by our head coach, Darryl Woods, with a team of volunteer coaches. Our welfare officer is Caroline Walton.
            </Faq>
            <Faq q="How much does it cost?">
              {taster > 0 && `Your first ${taster === 1 ? 'session is' : `${taster} sessions are`} free. `}
              {juniorSub ? (
                <>
                  After that, junior membership for {CURRENT_SEASON} is {formatPence(juniorSub.price_pence)} for the season
                  {juniorSub.price_2nd_child_pence && `, with brothers and sisters at ${formatPence(juniorSub.price_2nd_child_pence)}`}.
                  {familyRate && juniorSub.price_2nd_child_pence &&
                    ` If a parent has an ${familyRate.name.replace(/ \d{4}$/, '')}, the first child is ${formatPence(juniorSub.price_2nd_child_pence)} too.`}
                </>
              ) : (
                'After that, junior membership covers the whole season. Ask us for current prices.'
              )}
            </Faq>
            <Faq q="My child has never held a bat. Will they feel left out?">
              Not at all. Coaches work with every child at their own level, and plenty of others will be just starting too.
            </Faq>
          </Accordion>
          <p className="text-center text-muted-foreground mt-6">
            Anything else? <a href={ASK_LINK} className="text-primary underline underline-offset-2">Ask our junior coordinator</a>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to give it a go?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Send us a quick email and we'll see you at the next session.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg"><a href={TRY_LINK}>Try a session</a></Button>
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

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold font-display">
        {n}
      </span>
      <div className="pt-1.5">
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </li>
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

function AgeFinder() {
  const [dob, setDob] = useState('');
  const group = dob ? ageGroupFor(dob) : null;
  const session = group ? JUNIORS.training.find((t) => t.groups.includes(group)) : null;

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 md:p-8 self-start">
      <h2 className="text-3xl font-bold mb-2">Which group would my child be in?</h2>
      <p className="text-muted-foreground mb-6">Pop in their date of birth and we'll tell you.</p>
      <Label htmlFor="finder-dob">Child's date of birth</Label>
      <Input id="finder-dob" type="date" value={dob} max={new Date().toISOString().slice(0, 10)}
             onChange={(e) => setDob(e.target.value)} className="mt-2 mb-6 bg-background max-w-xs" />
      <div aria-live="polite">
        {group && isJunior(group) && (
          <div className="rounded-xl bg-background p-5 border border-border">
            <p className="text-2xl font-bold text-primary mb-1">{group} in {CURRENT_SEASON}</p>
            {session ? (
              <p className="text-muted-foreground">Training: {session.when}</p>
            ) : (
              <p className="text-muted-foreground">Get in touch and we'll tell you when they'd train.</p>
            )}
          </div>
        )}
        {group && !isJunior(group) && (
          <div className="rounded-xl bg-background p-5 border border-border">
            <p className="font-semibold mb-1">They'd be in our adult teams</p>
            <p className="text-muted-foreground">
              We'd love to have them. <Link to="/contact" className="text-primary underline underline-offset-2">Get in touch</Link> about adult cricket.
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Age groups follow the national rule: your child's age on 31 August before the season.
      </p>
    </div>
  );
}

export default Juniors;
