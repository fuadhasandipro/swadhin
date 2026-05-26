"use client";

import { useEffect, useState } from "react";
import { getSmsLogs, sendTestSMS, getSettings, updateSetting } from "@/lib/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Send, Save } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export function SMSSettingsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // API Token State
  const [apiToken, setApiToken] = useState("");
  const [savingToken, setSavingToken] = useState(false);

  // Test SMS state
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testing, setTesting] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [logsData, settings] = await Promise.all([getSmsLogs(), getSettings()]);
      setLogs(logsData);
      if (settings.sms_api_token) {
        setApiToken(settings.sms_api_token);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSaveToken = async () => {
    setSavingToken(true);
    try {
      await updateSetting('sms_api_token', apiToken);
      toast.success("SMS API Token saved!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingToken(false);
    }
  };

  const handleTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;

    setTesting(true);
    try {
      await sendTestSMS(testPhone, testMessage);
      toast.success("Test SMS sent successfully!");
      setTestPhone("");
      setTestMessage("");
      fetchInitialData(); // refresh logs
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-900/10 shadow-sm">
          <CardHeader>
            <CardTitle>SMS API Configuration</CardTitle>
            <CardDescription>Enter your third-party SMS provider token.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input 
                type="password"
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                placeholder="Enter secret token..."
              />
            </div>
            <Button onClick={handleSaveToken} disabled={savingToken} className="bg-emerald-600 hover:bg-emerald-700">
              {savingToken ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Token
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/10 shadow-sm">
          <CardHeader>
            <CardTitle>Send Test SMS</CardTitle>
            <CardDescription>Verify your SMS configuration is working.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTestSms} className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Message Content</Label>
                <Input 
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  placeholder="Hello from Swadhin Enterprise!"
                  required
                />
              </div>
              <Button type="submit" disabled={testing || !apiToken} variant="secondary">
                {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Message
              </Button>
              {!apiToken && <p className="text-xs text-red-500">Please save an API token first.</p>}
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-900/10 shadow-sm">
        <CardHeader>
          <CardTitle>Recent SMS Logs</CardTitle>
          <CardDescription>History of the last 50 automated SMS messages.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No SMS logs found.</TableCell>
                    </TableRow>
                  ) : (
                    logs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-slate-500">{format(new Date(log.sent_at), "PPp")}</TableCell>
                        <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {log.status}
                          </span>
                        </TableCell>
                        <TableCell className="truncate max-w-[300px] text-sm" title={log.message}>
                          {log.message}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
