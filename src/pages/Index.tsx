import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Trophy, MapPin, ArrowRight } from 'lucide-react';
import HeroCarousel from '@/components/HeroCarousel';
import Footer from '@/components/Footer';
import FixturesResults from '@/components/FixturesResults';
const Index = () => {
  return <div className="min-h-screen bg-background">
      {/* Hero Carousel Section */}
      <HeroCarousel />

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
                <p className="text-muted-foreground">KBCC continues to climb up the leagues in all formats, providing </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Regular Fixtures</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">With over 200 fixtures in 2024, you'll be sure to find cricket that suits your diary.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We're proud to be considered one of the premier grounds in Oxfordshire, as voted by our visiting opposition. </p>
              </CardContent>
            </Card>
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
              <a href="https://kingstonbagpuize.play-cricket.com/home" target="_blank" rel="noopener noreferrer">
                Become a Member <ArrowRight className="ml-2 h-5 w-5" />
              </a>
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