import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, Trophy, Star, Target, Zap } from 'lucide-react';

const PlayCricket = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Play Cricket</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8">
            Join Kingston Bagpuize Cricket Club and be part of our cricket family
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            Join Today
          </Button>
        </div>
      </section>

      {/* Teams & Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Teams & Categories</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Senior Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our main competitive team playing in the local league. 
                  Perfect for experienced players looking for regular competitive cricket.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Weekly league matches</li>
                  <li>• Training sessions</li>
                  <li>• Social events</li>
                  <li>• Age 16+</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Junior Cricket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Youth development program for young cricketers. 
                  Learn the fundamentals in a fun, supportive environment.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ages 8-16</li>
                  <li>• Skills development</li>
                  <li>• Modified formats</li>
                  <li>• Qualified coaches</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Social Cricket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Casual, friendly games for those who want to play cricket 
                  without the pressure of competitive leagues.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All skill levels</li>
                  <li>• Flexible commitment</li>
                  <li>• Social atmosphere</li>
                  <li>• Weekend games</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* What We Offer */}
          <div className="bg-accent p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-center mb-8 text-foreground">What We Offer</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Regular Training</h4>
                <p className="text-sm text-muted-foreground">
                  Weekly training sessions to improve your skills
                </p>
              </div>
              
              <div className="text-center">
                <Trophy className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Competitive Play</h4>
                <p className="text-sm text-muted-foreground">
                  Regular fixtures in local leagues
                </p>
              </div>
              
              <div className="text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Great Community</h4>
                <p className="text-sm text-muted-foreground">
                  Welcoming, friendly club atmosphere
                </p>
              </div>
              
              <div className="text-center">
                <Zap className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Equipment Available</h4>
                <p className="text-sm text-muted-foreground">
                  Club equipment available for new players
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Information */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Membership</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Junior Membership</CardTitle>
                <div className="text-3xl font-bold text-primary">£30</div>
                <p className="text-muted-foreground">per season</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Ages 8-16</li>
                  <li>• Training sessions</li>
                  <li>• Match participation</li>
                  <li>• Equipment loan</li>
                  <li>• Club social events</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Adult Membership</CardTitle>
                <div className="text-3xl font-bold text-primary">£80</div>
                <p className="text-muted-foreground">per season</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• League matches</li>
                  <li>• Training sessions</li>
                  <li>• Social cricket</li>
                  <li>• Club facilities</li>
                  <li>• All social events</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Family Membership</CardTitle>
                <div className="text-3xl font-bold text-primary">£150</div>
                <p className="text-muted-foreground">per season</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 2 adults + children</li>
                  <li>• All membership benefits</li>
                  <li>• Family training sessions</li>
                  <li>• Discounted social events</li>
                  <li>• Best value option</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="text-lg px-8 py-3">
              Apply for Membership
            </Button>
            <p className="text-muted-foreground mt-4">
              New members welcome! No experience necessary.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlayCricket;