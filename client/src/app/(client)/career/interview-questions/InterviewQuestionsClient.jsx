'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { interviewQuestionAPI, interviewCategoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HelpCircle, Search, Loader2 } from 'lucide-react';
import ListingHero from '@/components/listing-heroes/ListingHero';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function InterviewQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedCategory, selectedDifficulty]);

  const fetchCategories = async () => {
    try {
      const res = await interviewCategoryAPI.getAll();
      if (res.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      if (selectedDifficulty) {
        params.difficulty = selectedDifficulty;
      }

      const res = await interviewQuestionAPI.getAll(params);
      if (res.success) {
        setQuestions(res.data.questions || []);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q => 
    searchTerm === '' || 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      Easy: 'bg-green-600 text-white',
      Medium: 'bg-yellow-600 text-white',
      Hard: 'bg-red-600 text-white',
    };
    return colors[difficulty] || 'bg-gray-600 text-white';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-2">
        <Link href="/career" className="text-sm text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1">
          ← Career
        </Link>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <ListingHero
          badge="Resources"
          badgeColor="orange"
          title="Interview Questions"
          description="Common technical and HR interview questions with detailed answers. Prepare better with our comprehensive question bank."
          features={[
            { icon: HelpCircle, text: 'Technical & HR questions' },
            { icon: HelpCircle, text: 'Detailed answers & explanations' },
          ]}
          ctaText="Contact Us"
          ctaLink="/contact"
          gradientFrom="from-amber-600"
          gradientVia="via-orange-600"
          gradientTo="to-orange-800"
        />
      </div>

      <section id="content" className="max-w-5xl mx-auto px-4 pb-12">
        {/* Filters */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Questions</h2>
          
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                  {cat._count?.questions > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {cat._count.questions}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Difficulty Filters */}
          <div>
            <h3 className="text-sm font-medium mb-3">Difficulty</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDifficulty === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty('')}
              >
                All
              </Button>
              <Button
                variant={selectedDifficulty === 'Easy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty('Easy')}
              >
                Easy
              </Button>
              <Button
                variant={selectedDifficulty === 'Medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty('Medium')}
              >
                Medium
              </Button>
              <Button
                variant={selectedDifficulty === 'Hard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty('Hard')}
              >
                Hard
              </Button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No questions found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search term
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {filteredQuestions.map((question, index) => (
                <AccordionItem 
                  key={question.id} 
                  value={question.id}
                  className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/50">
                    <div className="flex items-start gap-4 w-full text-left">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/10 dark:bg-brand-400/10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base mb-2">{question.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {question.category?.name}
                          </Badge>
                          {question.difficulty && (
                            <Badge className={getDifficultyBadge(question.difficulty)}>
                              {question.difficulty}
                            </Badge>
                          )}
                          {question.tags && question.tags.length > 0 && (
                            question.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-muted/30">
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: question.answer }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Load More */}
            {pagination.page < pagination.totalPages && (
              <div className="text-center mt-8">
                <Button 
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                    fetchQuestions();
                  }}
                  variant="outline"
                >
                  Load More Questions
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
