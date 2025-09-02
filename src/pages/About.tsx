import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
const About = () => {
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About Kingston Bagpuize CC</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            A proud community cricket club with a rich history and passion for the game
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Our Story</h2>
              <p className="text-muted-foreground text-lg mb-4">Kingston Bagpuize Cricket Club has been at the heart of our community since 1834 when we were founded. </p>
              <p className="text-muted-foreground text-lg mb-4">We pride ourselves on being an inclusive, welcoming club that values community through both our competitive and social cricket offerings. </p>
              <p className="text-muted-foreground text-lg">
                Whether you're a seasoned player or new to the game, Kingston Bagpuize CC offers 
                a supportive environment where everyone can enjoy cricket.
              </p>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Community Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We're more than just a cricket club - we're a community that brings 
                    people together through our shared love of the game.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    All Abilities Welcome
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    From beginners to experienced players, everyone is welcome to join 
                    and develop their cricket skills with us.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Facts */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Calendar className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Year Round</h3>
                <p className="text-muted-foreground">KBCC's season starts indoors in January and runs through to mid September outdoors</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">All Ages</h3>
                <p className="text-muted-foreground">
                  Junior cricket begins at U9s! <Link to="/contact" className="text-primary hover:underline">Contact us</Link> to get started.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Local Grounds</h3>
                <p className="text-muted-foreground">KBCC is proud </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Trophy className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Competitive</h3>
                <p className="text-muted-foreground">Local league participation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>;
};
export default About;