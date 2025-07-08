// components/admin/LogTable.jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

// This component needs to be flexible based on logType
export function LogTable({ logs, logType }) {

  const renderTableHeader = () => {
    switch (logType) {
      case 'attendance':
        return (
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verified By</TableHead>
          </TableRow>
        );
      case 'vehicle':
        return (
          <TableRow>
            <TableHead>Vehicle No.</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Entry Time</TableHead>
            <TableHead>Exit Time</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Resident/Guest</TableHead>
            <TableHead>Guard</TableHead>
          </TableRow>
        );
      case 'unauthorized':
        return (
          <TableRow>
            <TableHead>Entry Time</TableHead>
            <TableHead>Visitor Name</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action Taken</TableHead>
            <TableHead>Guard</TableHead>
          </TableRow>
        );
      default:
        return <TableRow><TableHead>Log Data</TableHead></TableRow>;
    }
  };

  const renderTableRow = (log) => {
     switch (logType) {
      case 'attendance':
        return (
          <TableRow key={log._id}>
            <TableCell>{log.userId?.name || log.userId || 'N/A'}</TableCell>
            <TableCell>{format(new Date(log.timestamp), 'Pp')}</TableCell>
            <TableCell><Badge variant={log.type === 'entry' ? 'default' : 'secondary'}>{log.type}</Badge></TableCell>
            <TableCell>{log.location}</TableCell>
            <TableCell className="capitalize">{log.verificationMethod?.replace('_', ' ')}</TableCell>
            <TableCell className="capitalize">{log.status?.replace('_', ' ')}</TableCell>
            <TableCell>{log.verifiedBy?.name || 'N/A'}</TableCell>
          </TableRow>
        );
      case 'vehicle':
        return (
          <TableRow key={log._id}>
            <TableCell className="font-mono">{log.vehicleNumber}</TableCell>
            <TableCell><Badge>{log.type}</Badge></TableCell>
            <TableCell>{format(new Date(log.entryTime), 'Pp')}</TableCell>
            <TableCell>{log.exitTime ? format(new Date(log.exitTime), 'Pp') : '-'}</TableCell>
            <TableCell>{log.purpose || '-'}</TableCell>
            <TableCell>{log.residentId?.name || log.guestId?.name || 'N/A'}</TableCell>
             <TableCell>{log.securityGuardId?.name || 'N/A'}</TableCell>
          </TableRow>
        );
      case 'unauthorized':
        return (
          <TableRow key={log._id}>
             <TableCell>{format(new Date(log.entryTime), 'Pp')}</TableCell>
             <TableCell>{log.visitorName || '-'}</TableCell>
             <TableCell>{log.purpose}</TableCell>
             <TableCell><Badge variant={log.status === 'denied' ? 'destructive' : 'secondary'}>{log.status?.replace('_', ' ')}</Badge></TableCell>
             <TableCell>{log.actionTaken}</TableCell>
             <TableCell>{log.securityGuardId?.name || 'N/A'}</TableCell>
          </TableRow>
        );
      default:
        return <TableRow key={log._id}><TableCell>{JSON.stringify(log)}</TableCell></TableRow>;
    }
  };


  if (!logs || logs.length === 0) {
    return <p className="text-center text-muted-foreground mt-4">No {logType} logs found.</p>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>{renderTableHeader()}</TableHeader>
        <TableBody>{logs.map(renderTableRow)}</TableBody>
      </Table>
    </div>
  );
}