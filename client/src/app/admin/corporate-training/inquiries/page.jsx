'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { corporateTrainingAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FiArrowLeft, FiMail, FiPhone, FiGrid, FiUser } from 'react-icons/fi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CorporateTrainingInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await corporateTrainingAPI.getInquiries();
      if (res.success) {
        setInquiries(res.data.inquiries || []);
      }
    } catch (error) {
      toast.error('Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await corporateTrainingAPI.updateInquiryStatus(id, newStatus);
      toast.success('Status updated');
      fetchInquiries();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'bg-blue-600';
      case 'CONTACTED': return 'bg-yellow-600';
      case 'CONVERTED': return 'bg-green-600';
      case 'CLOSED': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <FiArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Training Inquiries</h1>
          </div>
          <p className="text-muted-foreground ml-10">Manage corporate training requests</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact Info</TableHead>
              <TableHead>Company & Program</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Loading inquiries...
                </TableCell>
              </TableRow>
            ) : inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No inquiries found
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium flex items-center gap-2">
                        <FiUser className="w-3 h-3 text-muted-foreground" /> {inquiry.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <FiMail className="w-3 h-3" /> {inquiry.email}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <FiPhone className="w-3 h-3" /> {inquiry.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {inquiry.companyName && (
                        <div className="font-medium">{inquiry.companyName}</div>
                      )}
                      {inquiry.training ? (
                        <Badge variant="outline" className="w-fit">
                          {inquiry.training.title}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">General Inquiry</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] text-sm truncate" title={inquiry.message}>
                      {inquiry.message || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={inquiry.status}
                      onValueChange={(val) => handleStatusChange(inquiry.id, val)}
                    >
                      <SelectTrigger className={`w-[130px] h-8 text-white ${getStatusColor(inquiry.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
