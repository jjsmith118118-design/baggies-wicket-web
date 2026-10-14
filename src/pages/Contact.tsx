import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Mail, Clock, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, DIRECTIONS_URL } from '@/config/club';
import { usePageMeta } from '@/hooks/usePageMeta';
const Contact = () => {
  usePageMeta({
    title: "Contact us | Kingston Bagpuize Cricket Club",
    description: "Get in touch with Kingston Bagpuize Cricket Club. The Sportsfield, Abingdon Road (A415), Kingston Bagpuize, OX13 5GD. Training Tuesdays from 6pm.",
  });
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground py-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/images/contact-batting-1280.jpg" srcSet="/images/contact-batting-640.jpg 640w, /images/contact-batting-1280.jpg 1280w" sizes="100vw" width="1280" height="853" 
            alt="Cricket batsman in action at Kingston Bagpuize Cricket Club" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-primary/70"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Get in touch with Kingston Bagpuize Cricket Club
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Get In Touch</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you're interested in joining the club, want to know about fixtures, 
              or have any questions, we'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 [&>*]:min-w-0 break-words">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Ground Location</h3>
                    <p className="text-muted-foreground">
                      Kingston Bagpuize Cricket Ground<br />
                      Kingston Bagpuize, Oxfordshire<br />
                      OX13 5GD
                    </p>
                    <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm mt-1 inline-block py-1.5">
                      Get directions
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Instagram className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Instagram</h3>
                    <p className="text-muted-foreground">
                      <a href="https://www.instagram.com/baggiescricket/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        @baggiescricket
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Email</h3>
                    <p className="text-muted-foreground">
                      <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Training Times</h3>
                    <p className="text-muted-foreground">
                      Tuesday evenings: from 6:00 PM<br />
                      Match days:{" "}
                      <Link to="/matches" className="text-primary hover:underline">see fixtures</Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img src="/images/contact-bowler-1280.jpg" srcSet="/images/contact-bowler-640.jpg 640w, /images/contact-bowler-1280.jpg 1280w" sizes="(min-width: 1024px) 50vw, 100vw" width="1280" height="853" loading="lazy" decoding="async" alt="Cricket bowler in action at Kingston Bagpuize Cricket Club" className="rounded-lg shadow-lg w-full h-auto" />
            </div>
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Don't leave it too late.</h2>
              <p className="text-2xl md:text-3xl text-primary font-semibold mb-8">
                Get in touch!
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're a seasoned player or just starting out, there's a place for you at Kingston Bagpuize Cricket Club. 
                Join our community and be part of something special.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                  Email Us Now
                </a>
                <a href="https://www.instagram.com/baggiescricket/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors font-semibold">Message on Instagram</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};
export default Contact;