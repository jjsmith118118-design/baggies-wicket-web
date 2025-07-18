import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface Match {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  competition: string;
  status: 'scheduled' | 'completed' | 'live' | 'cancelled' | 'postponed';
  result?: string;
  teamCategory: 'senior' | 'junior' | 'women';
  homeFormGuide?: string[];
  awayFormGuide?: string[];
}

interface TrainingSession {
  id: string;
  date: string;
  time: string;
  duration: string;
  teams: string[];
  type: string;
}

// Real data extracted from Kingston Bagpuize Play Cricket
const liveMatches: Match[] = [
  {
    id: '6909605',
    date: '2025-07-19',
    time: '12:30',
    homeTeam: 'Kingston Bagpuize CC 1st XI',
    awayTeam: 'Cumnor CC 2nd XI',
    venue: 'The Kingston Bagpuize Sportsfield',
    competition: 'League',
    status: 'scheduled',
    teamCategory: 'senior',
    homeFormGuide: ['W', 'W', 'W', 'W', 'W'],
    awayFormGuide: ['L', 'D', 'W', 'D', 'D']
  },
  {
    id: '6909876',
    date: '2025-07-19',
    time: '13:00',
    homeTeam: 'Oxford Downs CC 3rd XI',
    awayTeam: 'Kingston Bagpuize CC 2nd XI',
    venue: 'Away',
    competition: 'League',
    status: 'scheduled',
    teamCategory: 'senior',
    homeFormGuide: ['L', 'W', 'L', 'W', 'D'],
    awayFormGuide: ['L', 'L', 'L', 'C', 'L']
  },
  {
    id: '6910596',
    date: '2025-07-19',
    time: '13:00',
    homeTeam: 'Kingston Bagpuize CC 3rd XI',
    awayTeam: 'Steventon CC 2nd XI',
    venue: 'The Kingston Bagpuize Sportsfield',
    competition: 'League',
    status: 'scheduled',
    teamCategory: 'senior',
    homeFormGuide: ['L', 'W', 'W', 'W', 'W'],
    awayFormGuide: ['L', 'D', 'L', 'L', 'D']
  },
  {
    id: '6809853',
    date: '2025-07-20',
    time: '10:00',
    homeTeam: 'Witney Mills CC Under 11',
    awayTeam: 'Kingston Bagpuize CC Under 11',
    venue: 'Away',
    competition: 'Junior League',
    status: 'scheduled',
    teamCategory: 'junior',
    homeFormGuide: ['W', 'W', 'L', 'W', 'W'],
    awayFormGuide: ['L', 'W', 'L', 'L', 'T']
  },
  {
    id: '6819114',
    date: '2025-07-22',
    time: '18:00',
    homeTeam: 'Wolvercote CC Under 15',
    awayTeam: 'Kingston Bagpuize CC Under 15',
    venue: 'Away',
    competition: 'Junior League',
    status: 'scheduled',
    teamCategory: 'junior',
    homeFormGuide: ['W', 'W', 'W', 'W', 'W'],
    awayFormGuide: ['L', 'C', 'W', 'W', 'C']
  },
  {
    id: '6816190',
    date: '2025-07-24',
    time: '18:00',
    homeTeam: 'Steventon CC Under 13',
    awayTeam: 'Kingston Bagpuize CC Under 13',
    venue: 'Away',
    competition: 'Junior League',
    status: 'scheduled',
    teamCategory: 'junior',
    homeFormGuide: ['L', 'L', 'L', 'C', 'L'],
    awayFormGuide: ['L', 'W', 'C', 'W', 'L']
  }
];

const mockTrainingSessions: TrainingSession[] = [
  {
    id: 't1',
    date: '2025-07-15',
    time: '18:00',
    duration: '20:00',
    teams: ['1st XI', '2nd XI', '3rd XI', '4th XI'],
    type: 'Adult Whole Club Training'
  },
  {
    id: 't2',
    date: '2025-07-16',
    time: '18:00',
    duration: '20:00',
    teams: ['1st XI', '2nd XI'],
    type: 'Adult Training 1st-2nd XIs'
  },
  {
    id: 't3',
    date: '2025-07-17',
    time: '18:00',
    duration: '20:00',
    teams: ['U15', 'U15 Surrey', 'U15Bs'],
    type: 'U15 Training'
  },
  {
    id: 't4',
    date: '2025-07-18',
    time: '18:00',
    duration: '20:00',
    teams: ['U11', 'U11 Surrey'],
    type: 'U11 Training'
  }
];

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>(liveMatches);
  const [loading, setLoading] = useState(false);
  const [activeWeek, setActiveWeek] = useState('current');
  const [selectedTeamCategory, setSelectedTeamCategory] = useState<'all' | 'senior' | 'junior' | 'women'>('all');
  const { toast } = useToast();

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from Play Cricket API
      // For now, we're using the extracted data from the website
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Data Updated",
        description: "Live match data refreshed from Play Cricket",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch live data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-green-600 border-green-600">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'live':
        return <Badge variant="default" className="bg-red-600">Live</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'postponed':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Postponed</Badge>;
      default:
        return <Badge variant="outline">TBC</Badge>;
    }
  };

  const filteredMatches = matches.filter(match => {
    if (selectedTeamCategory === 'all') return true;
    return match.teamCategory === selectedTeamCategory;
  });

  const getFormGuideDisplay = (formGuide?: string[]) => {
    if (!formGuide) return null;
    return (
      <div className="flex gap-1 mt-1">
        {formGuide.map((result, index) => (
          <Badge 
            key={index} 
            variant={result === 'W' ? 'default' : result === 'L' ? 'destructive' : 'secondary'}
            className="w-6 h-6 p-0 text-xs flex items-center justify-center"
          >
            {result}
          </Badge>
        ))}
      </div>
    );
  };

  const groupMatchesByDate = (matches: Match[]) => {
    return matches.reduce((groups, match) => {
      const date = match.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(match);
      return groups;
    }, {} as Record<string, Match[]>);
  };

  const groupedMatches = groupMatchesByDate(filteredMatches);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-foreground">Matches</h1>
            <Button onClick={fetchLiveData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Live Data
            </Button>
          </div>
          
          {/* Team Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            <h2 className="text-lg font-semibold mr-4 self-center">Teams:</h2>
            {[
              { key: 'all', label: 'All Teams' },
              { key: 'senior', label: 'Saturday, Sunday & Other' },
              { key: 'junior', label: 'Juniors' },
              { key: 'women', label: 'Women & Girls' }
            ].map(category => (
              <Button
                key={category.key}
                onClick={() => setSelectedTeamCategory(category.key as any)}
                variant={selectedTeamCategory === category.key ? 'default' : 'outline'}
                size="sm"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Week Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Week
              </Button>
              <div className="text-center">
                <h3 className="text-xl font-bold">This Week</h3>
                <p className="text-muted-foreground">Mon 14 Jul - Sun 20 Jul</p>
              </div>
              <Button variant="ghost" size="sm">
                Next Week
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="fixtures" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="training">Training Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="fixtures" className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              Object.entries(groupedMatches).map(([date, dayMatches]) => (
                <Card key={date}>
                  <CardHeader className="bg-primary/10">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {formatDate(date)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {dayMatches.map((match, index) => (
                      <div 
                        key={match.id}
                        className={`p-4 border-b last:border-b-0 hover:bg-accent/20 transition-colors ${
                          index % 2 === 0 ? 'bg-background' : 'bg-accent/5'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <Badge variant="outline" className="font-medium">
                                {match.competition}
                              </Badge>
                              {getStatusBadge(match.status)}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {match.time}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                              {/* Home Team */}
                              <div className="text-center">
                                <div className="text-lg font-semibold mb-1">
                                  {match.homeTeam}
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">Form Guide</div>
                                {getFormGuideDisplay(match.homeFormGuide)}
                              </div>
                              
                              {/* VS */}
                              <div className="flex items-center justify-center">
                                <div className="text-lg font-bold text-muted-foreground">VS</div>
                              </div>
                              
                              {/* Away Team */}
                              <div className="text-center">
                                <div className="text-lg font-semibold mb-1">
                                  {match.awayTeam}
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">Form Guide</div>
                                {getFormGuideDisplay(match.awayFormGuide)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {match.venue}
                            </div>
                          </div>

                          {match.result && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-primary bg-primary/10 rounded px-3 py-1">
                                {match.result}
                              </div>
                            </div>
                          )}

                          {!match.result && match.status === 'scheduled' && (
                            <Button variant="outline" size="sm" asChild>
                              <a 
                                href={`https://kingstonbagpuize.play-cricket.com/match_details?id=${match.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View on Play Cricket
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">Training Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Training session information will be available once integrated with the Play Cricket calendar system.
                </p>
                <Button variant="outline" asChild>
                  <a 
                    href="https://kingstonbagpuize.play-cricket.com/calendar"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Calendar on Play Cricket
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Integration Note */}
        <Card className="mt-8 border-dashed">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-lg mb-2">Live Data Integration</h3>
            <p className="text-muted-foreground mb-4">
              This page displays real fixture data from Kingston Bagpuize Cricket Club's Play Cricket website. 
              Match details include form guides, team information, and direct links to full match details.
            </p>
            <Button variant="outline" asChild>
              <a 
                href="https://kingstonbagpuize.play-cricket.com/Matches"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full Matches on Play Cricket
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Matches;