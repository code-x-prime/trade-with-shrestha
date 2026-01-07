'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Trash2, 
  Eye, 
  Mail, 
  RefreshCw,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

import { contactAPI } from '@/lib/api';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await contactAPI.getContacts({
        page,
        limit: 10,
        search: search || undefined
      });

      if (response.success) {
        setContacts(response.data.contacts);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast.error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Error fetching contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchContacts();
    }, 500);

    return () => clearTimeout(timer);
  }, [page, search]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await contactAPI.markAsRead(id);
      
      if (response.success) {
        setContacts(contacts.map(c => c.id === id ? { ...c, isRead: true } : c));
        toast.success('Marked as read');
        if (selectedContact?.id === id) {
          setSelectedContact(prev => ({ ...prev, isRead: true }));
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await contactAPI.deleteContact(id);
      
      if (response.success) {
        setContacts(contacts.filter(c => c.id !== id));
        toast.success('Message deleted');
        if (selectedContact?.id === id) {
          setViewDialogOpen(false);
          setSelectedContact(null);
        }
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const openViewDialog = (contact) => {
    setSelectedContact(contact);
    setViewDialogOpen(true);
    if (!contact.isRead) {
      handleMarkAsRead(contact.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
        <Button onClick={fetchContacts} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or subject..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Add filter dropdown if needed */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading messages...
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No messages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id} className={!contact.isRead ? 'bg-muted/50' : ''}>
                      <TableCell>
                        {contact.isRead ? (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Read</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">New</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-xs text-muted-foreground">{contact.email}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {contact.subject}
                      </TableCell>
                      <TableCell>
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openViewDialog(contact)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.location.href = `mailto:${contact.email}`}>
                                <Mail className="h-4 w-4 mr-2" /> Reply via Email
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(contact.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm font-medium">Page {page} of {totalPages}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              Received on {selectedContact && new Date(selectedContact.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedContact && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">From</span>
                  <p className="text-base font-medium">{selectedContact.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Email</span>
                  <div className="flex items-center gap-2">
                    <p className="text-base">{selectedContact.email}</p>
                  </div>
                </div>
                {selectedContact.phone && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Phone</span>
                    <p className="text-base">{selectedContact.phone}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Subject</span>
                  <p className="text-base">{selectedContact.subject}</p>
                </div>
              </div>
              
              <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
                <span className="text-sm font-medium text-muted-foreground">Message</span>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedContact.message}</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                <Button asChild>
                  <a href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`}>
                    <Mail className="mr-2 h-4 w-4" /> Reply
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
