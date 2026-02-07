'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { corporateTrainingAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { FiEdit, FiTrash2, FiPlus, FiCheckCircle, FiXCircle, FiUsers, FiClock, FiGlobe } from 'react-icons/fi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminCorporateTrainingPage() {
  const router = useRouter();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await corporateTrainingAPI.getAllAdmin();
      if (res.success) {
        setTrainings(res.data.trainings || []);
      }
    } catch (error) {
      toast.error('Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await corporateTrainingAPI.delete(deleteId);
      toast.success('Training program deleted');
      fetchTrainings();
      setDeleteId(null);
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await corporateTrainingAPI.toggleActive(id);
      toast.success('Status updated');
      fetchTrainings();
    } catch (error) {
      toast.error('Toggle failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Corporate Training</h1>
          <p className="text-muted-foreground">Manage training programs & certifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/corporate-training/inquiries')}>
            <FiUsers className="mr-2" /> View Inquiries
          </Button>
          <Button onClick={() => router.push('/admin/corporate-training/new')}>
            <FiPlus className="mr-2" /> New Program
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Mode & Duration</TableHead>
              <TableHead>Inquiries</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Loading programs...
                </TableCell>
              </TableRow>
            ) : trainings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No training programs found
                </TableCell>
              </TableRow>
            ) : (
              trainings.map((training) => (
                <TableRow key={training.id}>
                  <TableCell>
                    <div className="font-medium">{training.title}</div>
                    <code className="text-xs text-muted-foreground">{training.slug}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {training.mode && (
                        <div className="flex items-center gap-1">
                          <FiGlobe className="w-3 h-3 text-muted-foreground" />
                          <span>{training.mode}</span>
                        </div>
                      )}
                      {training.duration && (
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3 text-muted-foreground" />
                          <span>{training.duration}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{training._count?.inquiries || 0} Inquiries</Badge>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleActive(training.id)}>
                      {training.isActive ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <FiCheckCircle className="mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <FiXCircle className="mr-1" /> Inactive
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/corporate-training/${training.id}/edit`}>
                        <FiEdit />
                      </Link>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteId(training.id)}>
                      <FiTrash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the training program.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
