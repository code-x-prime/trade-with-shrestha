'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, Search, GraduationCap, User } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ManualEnrollPage() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  
  // Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Courses
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Form
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch.length >= 2) {
        searchUsers();
      } else {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch(`${API_BASE}/courses?published=true&limit=100`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const searchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await adminAPI.getUsers({ search: userSearch, limit: 20 });
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }

    setSubmitting(true);
    setSuccess(null);

    try {
      const response = await adminAPI.manualEnroll({
        userId: selectedUser.id,
        courseId: selectedCourse.id,
        amountPaid: amountPaid ? parseFloat(amountPaid) : selectedCourse.salePrice || selectedCourse.price,
        paymentMode,
      });

      if (response.success) {
        setSuccess({
          user: response.data.user,
          course: response.data.course,
          order: response.data.order,
        });
        toast.success('User enrolled successfully!');
        
        // Reset form
        setSelectedUser(null);
        setSelectedCourse(null);
        setAmountPaid('');
        setUserSearch('');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to enroll user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manual Course Enrollment</h1>
        <p className="text-muted-foreground">
          Enroll users in courses manually (for cash, bank transfer, or other payment methods)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enrollment Form */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Enroll User</CardTitle>
            <CardDescription>
              Select a user and course to create manual enrollment with order tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Search */}
              <div className="space-y-2">
                <Label htmlFor="user">Select User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setSelectedUser(null);
                    }}
                    className="pl-10"
                  />
                </div>
                
                {/* User Results */}
                {loadingUsers && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                )}
                
                {!loadingUsers && users.length > 0 && !selectedUser && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearch(user.name || user.email);
                          setUsers([]);
                        }}
                        className="w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium">{user.name || 'No Name'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedUser && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <User className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        {selectedUser.name || 'No Name'}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {selectedUser.email}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Course Select */}
              <div className="space-y-2">
                <Label htmlFor="course">Select Course</Label>
                {loadingCourses ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading courses...
                  </div>
                ) : (
                  <Select
                    value={selectedCourse?.id || ''}
                    onValueChange={(value) => {
                      const course = courses.find(c => c.id === value);
                      setSelectedCourse(course);
                      if (course) {
                        setAmountPaid(String(course.salePrice || course.price || 0));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a published course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <span>{course.title}</span>
                            <span className="text-muted-foreground">
                              - ₹{course.salePrice || course.price || 'Free'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Amount Paid */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Paid (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount received"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave as is for full price, or enter discounted amount if applicable
                </p>
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !selectedUser || !selectedCourse}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Enroll User
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Success Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Enrollment Status</CardTitle>
            <CardDescription>
              Recent enrollment details will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Enrollment Successful!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Order created and user enrolled
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">User</span>
                    <span className="font-medium">{success.user.name || success.user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Course</span>
                    <span className="font-medium">{success.course.title}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Order #</span>
                    <span className="font-mono text-sm">{success.order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">₹{success.order.finalAmount}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                      COMPLETED
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent enrollments</p>
                <p className="text-sm mt-1">Complete the form to enroll a user</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
