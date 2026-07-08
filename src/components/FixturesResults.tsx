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

// Empty array - no sample data, ready for real API integration
const liveMatches: Match[] = [];

const FixturesResults = () => {
  const [matches, setMatches] = useState<Match[]>(liveMatches);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'senior' | 'junior' | 'women'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchMatchData();
  }, []);

  // Play Cricket API credentials
  const SITE_ID = '3758';
  const API_TOKEN = '33239cdb5dc60ba5c114a5dd885a8200';
  const SEASON = new Date().getFullYear().toString();

  // Function to fetch data from Play Cricket API
  const fetchMatchData = async () => {
    setLoading(true);
    try {
      const [fixturesResponse, resultsResponse] = await Promise.all([
        fetch(`https://play-cricket.com/api/v2/matches.json?site_id=${SITE_ID}&season=${SEASON}&api_token=${API_TOKEN}`),
        fetch(`https://play-cricket.com/api/v2/result_summary.json?site_id=${SITE_ID}&season=${SEASON}&api_token=${API_TOKEN}`)
      ]);
      
      if (!fixturesResponse.ok || !resultsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [fixturesData, resultsData] = await Promise.all([
        fixturesResponse.json(),
        resultsResponse.json()
      ]);
      
      // Map fixtures
      const mappedFixtures: Match[] = fixturesData.matches?.map((match: any) => {
        const [day, month, year] = match.match_date?.split('/') || ['1', '1', '2025'];
        const matchDate = new Date(`${year}-${month}-${day}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare only dates
        
        // Only include future matches or live matches from fixtures
        if (matchDate >= today || match.status === 'L') {
          return {
            id: match.id?.toString() || Math.random().toString(),
            date: match.match_date || new Date().toISOString().split('T')[0],
            time: match.match_time || '14:30',
            homeTeam: match.home_club_name || 'Home Team',
            awayTeam: match.away_club_name || 'Away Team',
            venue: match.ground_name || 'Ground',
            competition: match.competition_name || 'League',
            status: match.status === 'L' ? 'live' as const : 'scheduled' as const,
            teamCategory: 'senior' as const,
          };
        }
        return null;
      }).filter(Boolean) || [];

      // Map results
      const mappedResults: Match[] = resultsData.result_summary?.map((result: any) => ({
        id: result.id?.toString() || Math.random().toString(),
        date: result.match_date || new Date().toISOString().split('T')[0],
        time: result.match_time || '14:30',
        homeTeam: result.home_club_name || 'Home Team',
        awayTeam: result.away_club_name || 'Away Team',
        venue: result.ground_name || 'Ground',
        competition: result.competition_name || 'League',
        status: 'completed' as const,
        result: result.result_description || result.result || 'Result unavailable',
        teamCategory: 'senior' as const,
      })) || [];

      const allMatches = [...mappedFixtures, ...mappedResults];
      setMatches(allMatches);
      
      toast({
        title: "Data Updated",
        description: `Loaded ${allMatches.length} matches from Play Cricket`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error fetching Play Cricket data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch match data from Play Cricket API",
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


  const formatDate = (dateStr: string) => {
    // Convert DD/MM/YYYY to YYYY-MM-DD for proper parsing
    const [day, month, year] = dateStr.split('/');
    const date = new Date(`${year}-${month}-${day}`);
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
  const upcomingMatches = filteredMatches
    .filter(match => match.status === 'scheduled' || match.status === 'live')
    .sort((a, b) => {
      // Convert DD/MM/YYYY to YYYY-MM-DD for proper sorting
      const [dayA, monthA, yearA] = a.date.split('/');
      const [dayB, monthB, yearB] = b.date.split('/');
      const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
      const dateB = new Date(`${yearB}-${monthB}-${dayB}`);
      return dateA.getTime() - dateB.getTime();
    });
  
  const recentResults = filteredMatches
    .filter(match => match.status === 'completed')
    .sort((a, b) => {
      // Convert DD/MM/YYYY to YYYY-MM-DD for proper sorting (most recent first)
      const [dayA, monthA, yearA] = a.date.split('/');
      const [dayB, monthB, yearB] = b.date.split('/');
      const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
      const dateB = new Date(`${yearB}-${monthB}-${dayB}`);
      return dateB.getTime() - dateA.getTime();
    });

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
                  <Card key={match.id} className="p-4 hover-scale hover:bg-accent/50">
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
                  <Card key={match.id} className="p-4 hover-scale hover:bg-accent/50">
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