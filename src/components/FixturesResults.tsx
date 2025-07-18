import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Match {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  competition: string;
  status: 'scheduled' | 'completed' | 'live';
  result?: string;
  teamCategory: 'senior' | 'junior' | 'women';
}

// Mock data structure based on Play Cricket format
const mockMatches: Match[] = [
  {
    id: '1',
    date: '2025-07-19',
    time: '12:30',
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
    time: '13:00',
    homeTeam: 'Oxford Downs CC 3rd XI',
    awayTeam: 'Kingston Bagpuize CC 2nd XI',
    venue: 'Away',
    competition: 'Division 3 West',
    status: 'scheduled',
    teamCategory: 'senior'
  },
  {
    id: '3',
    date: '2025-07-20',
    time: '10:00',
    homeTeam: 'Witney Mills CC Under 11',
    awayTeam: 'Kingston Bagpuize CC Under 11',
    venue: 'Away',
    competition: 'Junior League',
    status: 'scheduled',
    teamCategory: 'junior'
  },
  {
    id: '4',
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
    id: '5',
    date: '2025-07-12',
    time: '13:00',
    homeTeam: 'Outlaws 2.0 CC 1st XI',
    awayTeam: 'Kingston Bagpuize CC 4th XI',
    venue: 'Away',
    competition: 'Division 8 West',
    status: 'completed',
    result: '197 - 155',
    teamCategory: 'senior'
  },
  {
    id: '6',
    date: '2025-07-12',
    time: '15:00',
    homeTeam: 'Hampton Hill CC 3rd XI',
    awayTeam: 'Kingston Bagpuize CC 5th XI',
    venue: 'Away',
    competition: 'Division 10 West Central',
    status: 'completed',
    result: '89/3 - 88',
    teamCategory: 'senior'
  }
];

const FixturesResults = () => {
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'senior' | 'junior' | 'women'>('all');
  const { toast } = useToast();

  // Function to fetch data from Play Cricket API
  const fetchMatchData = async () => {
    setLoading(true);
    try {
      // This would be the actual API call to Play Cricket
      // const response = await fetch(`https://play-cricket.com/api/v2/matches.json?site_id=YOUR_SITE_ID&season=2025&api_token=YOUR_API_TOKEN`);
      // const data = await response.json();
      
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Data Updated",
        description: "Fixtures and results have been refreshed",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch match data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (activeTab === 'all') return true;
    return match.teamCategory === activeTab;
  });

  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const date = match.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(match);
    return groups;
  }, {} as Record<string, Match[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'live':
        return <Badge variant="default">Live</Badge>;
      default:
        return <Badge variant="outline">TBC</Badge>;
    }
  };

  // Separate fixtures and results
  const upcomingMatches = filteredMatches.filter(match => 
    match.status === 'scheduled' || match.status === 'live'
  );
  
  const recentResults = filteredMatches.filter(match => 
    match.status === 'completed'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Fixtures & Results</h2>
        <Button onClick={fetchMatchData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Teams', count: matches.length },
          { key: 'senior', label: 'Saturday, Sunday & Other', count: matches.filter(m => m.teamCategory === 'senior').length },
          { key: 'junior', label: 'Junior', count: matches.filter(m => m.teamCategory === 'junior').length },
          { key: 'women', label: 'Women & Girls', count: matches.filter(m => m.teamCategory === 'women').length }
        ].map(tab => (
          <Button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
          >
            {tab.label}
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upcoming Matches */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">
              Upcoming Matches
            </h3>
            <div className="space-y-3">
              {upcomingMatches.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No upcoming fixtures</p>
              ) : (
                upcomingMatches.slice(0, 5).map((match) => (
                  <Card key={match.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-medium">{match.competition}</span>
                        <span className="text-sm font-medium">{formatDate(match.date)} - {match.time}</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {match.homeTeam}
                      </div>
                      <div className="text-lg font-semibold">
                        {match.awayTeam}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.venue}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Recent Results */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">
              Recent Results
            </h3>
            <div className="space-y-3">
              {recentResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent results</p>
              ) : (
                recentResults.slice(0, 5).map((match) => (
                  <Card key={match.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-medium">{match.competition}</span>
                        <span className="text-sm font-medium">{formatDate(match.date)}</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {match.homeTeam}
                      </div>
                      <div className="text-lg font-semibold">
                        {match.awayTeam}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.venue}
                      </div>
                      {match.result && (
                        <div className="text-sm font-medium text-primary bg-primary/10 rounded px-2 py-1">
                          {match.result}
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <Button variant="outline" asChild>
          <a href="#" className="text-primary hover:text-primary-foreground">
            View all matches
          </a>
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Match data will be integrated with Play Cricket API for live updates.</p>
      </div>
    </div>
  );
};

export default FixturesResults;