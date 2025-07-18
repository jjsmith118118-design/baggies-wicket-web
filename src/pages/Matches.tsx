import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
}

interface TrainingSession {
  id: string;
  date: string;
  time: string;
  duration: string;
  teams: string[];
  type: string;
}

// Mock data for Kingston Bagpuize CC
const mockMatches: Match[] = [
  // This week's fixtures
  {
    id: '1',
    date: '2025-07-19',
    time: '11:00',
    homeTeam: 'Kingston Bagpuize CC 1st XI',
    awayTeam: 'Cumnor CC 2nd XI',
    venue: 'The Kingston Bagpuize Sportsfield',
    competition: 'Premier Division',
    status: 'scheduled',
    teamCategory: 'senior'
  },
  {
    id: '2',
    date: '2025-07-19',
    time: '12:00',
    homeTeam: 'Oxford Downs CC 3rd XI',
    awayTeam: 'Kingston Bagpuize CC 2nd XI',
    venue: 'Away',
    competition: 'Division 3 West',
    status: 'scheduled',
    teamCategory: 'senior'
  },
  {
    id: '3',
    date: '2025-07-19',
    time: '13:00',
    homeTeam: 'Kingston Bagpuize CC 3rd XI',
    awayTeam: 'Witney Mills CC 2nd XI',
    venue: 'The Kingston Bagpuize Sportsfield',
    competition: 'Division 8 Central',
    status: 'scheduled',
    teamCategory: 'senior'
  },
  {
    id: '4',
    date: '2025-07-20',
    time: '09:30',
    homeTeam: 'Kingston Bagpuize CC Under 11',
    awayTeam: 'Witney Mills CC Under 11',
    venue: 'The Kingston Bagpuize Sportsfield',
    competition: 'Under 11 Tier 2 Sunday West',
    status: 'scheduled',
    teamCategory: 'junior'
  },
  {
    id: '5',
    date: '2025-07-20',
    time: '10:00',
    homeTeam: 'Hampton Hill CC Under 13',
    awayTeam: 'Kingston Bagpuize CC Under 13',
    venue: 'Away',
    competition: 'Under 13 Tier 2 Sunday',
    status: 'scheduled',
    teamCategory: 'junior'
  },
  // Recent results
  {
    id: '6',
    date: '2025-07-12',
    time: '14:00',
    homeTeam: 'Kingston Bagpuize CC 3rd XI',
    awayTeam: 'Maori Oxshott CC 2nd XI',
    venue: 'The Kingston Bagpuize Sportsfield',
    competition: 'Division 8 Central',
    status: 'completed',
    result: '227/7 - 223/6',
    teamCategory: 'senior'
  },
  {
    id: '7',
    date: '2025-07-12',
    time: '13:00',
    homeTeam: 'Outlaws 2.0 CC 1st XI',
    awayTeam: 'Kingston Bagpuize CC 4th XI',
    venue: 'Away',
    competition: 'Division 8 West',
    status: 'completed',
    result: '197 - 155',
    teamCategory: 'senior'
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
  const [activeWeek, setActiveWeek] = useState('current');
  const [selectedTeamCategory, setSelectedTeamCategory] = useState<'all' | 'senior' | 'junior' | 'women'>('all');

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

  const filteredMatches = mockMatches.filter(match => {
    if (selectedTeamCategory === 'all') return true;
    return match.teamCategory === selectedTeamCategory;
  });

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
  const groupedTraining = mockTrainingSessions.reduce((groups, session) => {
    const date = session.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, TrainingSession[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Matches</h1>
          
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
            {Object.entries(groupedMatches).map(([date, dayMatches]) => (
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
                          
                          <div className="text-lg font-semibold mb-2">
                            {match.homeTeam} vs {match.awayTeam}
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
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            {Object.entries(groupedTraining).map(([date, sessions]) => (
              <Card key={date}>
                <CardHeader className="bg-accent/30">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {formatDate(date)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {sessions.map((session, index) => (
                    <div 
                      key={session.id}
                      className={`p-4 border-b last:border-b-0 ${
                        index % 2 === 0 ? 'bg-background' : 'bg-accent/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <Badge variant="secondary">Training</Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {session.time} - {session.duration}
                            </div>
                          </div>
                          <div className="text-lg font-semibold mb-1">{session.type}</div>
                          <div className="text-sm text-muted-foreground">
                            Teams: {session.teams.join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          The Kingston Bagpuize Sportsfield
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Integration Note */}
        <Card className="mt-8 border-dashed">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-lg mb-2">Live Data Integration</h3>
            <p className="text-muted-foreground">
              This matches page is ready to integrate with the Play Cricket API for real-time match data and results.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Matches;