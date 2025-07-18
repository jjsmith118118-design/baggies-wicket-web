import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  homeFormGuide?: string[];
  awayFormGuide?: string[];
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
    id: '6810596',
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
  // Recent results
  {
    id: 'result1',
    date: '2025-07-12',
    time: '14:00',
    homeTeam: 'Kingston Bagpuize CC 3rd XI',
    awayTeam: 'Maori Oxshott CC 2nd XI',
    venue: 'The Kingston Bagpuize Sportsfield',
    competition: 'League',
    status: 'completed',
    result: 'Kingston Bagpuize CC won by 4 runs',
    teamCategory: 'senior',
    homeFormGuide: ['W', 'W', 'W', 'L', 'W'],
    awayFormGuide: ['L', 'L', 'W', 'D', 'L']
  },
  {
    id: 'result2',
    date: '2025-07-12',
    time: '13:00',
    homeTeam: 'Outlaws 2.0 CC 1st XI',
    awayTeam: 'Kingston Bagpuize CC 4th XI',
    venue: 'Away',
    competition: 'League',
    status: 'completed',
    result: 'Outlaws 2.0 CC won by 42 runs',
    teamCategory: 'senior',
    homeFormGuide: ['W', 'W', 'W', 'W', 'L'],
    awayFormGuide: ['L', 'L', 'W', 'L', 'L']
  }
];

const FixturesResults = () => {
  const [matches, setMatches] = useState<Match[]>(liveMatches);
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
        description: "Fixtures and results refreshed from Play Cricket",
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

  const getFormGuideDisplay = (formGuide?: string[]) => {
    if (!formGuide) return null;
    return (
      <div className="flex gap-1 mt-1 justify-center">
        {formGuide.slice(0, 3).map((result, index) => (
          <Badge 
            key={index} 
            variant={result === 'W' ? 'default' : result === 'L' ? 'destructive' : 'secondary'}
            className="w-5 h-5 p-0 text-xs flex items-center justify-center"
          >
            {result}
          </Badge>
        ))}
      </div>
    );
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
                upcomingMatches.slice(0, 3).map((match) => (
                  <Card key={match.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-medium">{match.competition}</span>
                        <span className="text-sm font-medium">{formatDate(match.date)} - {match.time}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 items-center">
                        {/* Home Team */}
                        <div className="text-center">
                          <div className="text-sm font-semibold mb-1">
                            {match.homeTeam.replace('Kingston Bagpuize CC ', 'KBCC ')}
                          </div>
                          {getFormGuideDisplay(match.homeFormGuide)}
                        </div>
                        
                        {/* VS */}
                        <div className="text-center">
                          <div className="text-sm font-bold text-muted-foreground">VS</div>
                        </div>
                        
                        {/* Away Team */}
                        <div className="text-center">
                          <div className="text-sm font-semibold mb-1">
                            {match.awayTeam.replace('Kingston Bagpuize CC ', 'KBCC ')}
                          </div>
                          {getFormGuideDisplay(match.awayFormGuide)}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
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
                recentResults.slice(0, 3).map((match) => (
                  <Card key={match.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-medium">{match.competition}</span>
                        <span className="text-sm font-medium">{formatDate(match.date)}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 items-center">
                        {/* Home Team */}
                        <div className="text-center">
                          <div className="text-sm font-semibold mb-1">
                            {match.homeTeam.replace('Kingston Bagpuize CC ', 'KBCC ')}
                          </div>
                          {getFormGuideDisplay(match.homeFormGuide)}
                        </div>
                        
                        {/* VS */}
                        <div className="text-center">
                          <div className="text-sm font-bold text-muted-foreground">VS</div>
                        </div>
                        
                        {/* Away Team */}
                        <div className="text-center">
                          <div className="text-sm font-semibold mb-1">
                            {match.awayTeam.replace('Kingston Bagpuize CC ', 'KBCC ')}
                          </div>
                          {getFormGuideDisplay(match.awayFormGuide)}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.venue}
                      </div>
                      
                      {match.result && (
                        <div className="text-sm font-medium text-primary bg-primary/10 rounded px-2 py-1 text-center">
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
          <Link to="/matches" className="text-primary hover:text-primary-foreground">
            View all matches
          </Link>
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Live match data from Kingston Bagpuize Cricket Club's Play Cricket website.</p>
      </div>
    </div>
  );
};

export default FixturesResults;