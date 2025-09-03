import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Trophy, MapPin, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import FixturesResults from '@/components/FixturesResults';
const Index = () => {
  return <div className="min-h-screen bg-background">
      {/* Hero Section 1 - Kingston Bagpuize Cricket Club */}
      <section className="bg-maroon text-maroon-foreground py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Kingston Bagpuize Cricket Club
              </h1>
              <p className="text-lg md:text-xl mb-8 text-maroon-foreground/80">
                Welcome to KBCC, our home of cricket in Oxfordshire. We currently operate 3 league, 2 T20 league, a women's and friendly XI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                  <a href="https://kingstonbagpuize.play-cricket.com/home" target="_blank" rel="noopener noreferrer">
                    Join the Club
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-3 border-maroon-foreground text-maroon-foreground hover:bg-maroon-foreground hover:text-maroon">
                  
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <img src="/lovable-uploads/070ca7f0-f8c8-47f5-b12f-2406b86bda16.png" alt="Team huddle at Kingston Bagpuize Cricket Club" className="w-full max-w-md h-auto rounded-lg shadow-lg object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Why Choose Kingston Bagpuize CC?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">A welcoming club that brings together cricket enthusiasts of all ages and abilities.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Competitive Cricket</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">KBCC continues to climb up the leagues in all formats. Proud of winners of 5 league titles in 2025</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Regular Fixtures</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">With over 180 fixtures in 2024, you'll be sure to find cricket that suits your schedule.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We're proud to be in the top 5 grounds in Oxfordshire, as voted by our visiting opposition. </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Hero Section 2 - Competitive Cricket */}
      <section className="bg-maroon text-maroon-foreground py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Competitive Cricket
              </h1>
              <p className="text-xl md:text-2xl mb-6 font-medium text-maroon-foreground/90">
                Challenge Yourself
              </p>
              <p className="text-lg md:text-xl mb-8 text-maroon-foreground/80">
                Take part in regular league matches and tournaments. Test your skills against local teams in a competitive yet friendly environment.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3" onClick={() => {
                const element = document.getElementById('fixtures-results');
                if (element) {
                  element.scrollIntoView({
                    behavior: 'smooth'
                  });
                }
              }}>
                  View Fixtures
                </Button>
                <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <img src="/lovable-uploads/bcc03811-3886-486f-a255-186e51b81487.png" alt="Competitive cricket action" className="w-full max-w-md h-auto rounded-lg shadow-lg object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Fixtures & Results Section */}
      <section id="fixtures-results" className="py-16 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FixturesResults />
        </div>
      </section>


      {/* Call to Action Section */}
      <section className="py-16 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Ready to Play Cricket?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're a seasoned player or new to cricket, we welcome everyone to join our club family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link to="/contact">
                Become a Member <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-3">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Info Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Season Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our cricket season runs from April through September, with regular training 
                  sessions and league matches throughout the summer months.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  All Welcome
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We welcome players of all skill levels, from complete beginners to 
                  experienced cricketers looking for competitive play.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Find Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Located in Kingston Bagpuize, Oxfordshire. Easy to reach with 
                  parking available and great facilities for players and spectators.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>;
};
export default Index;