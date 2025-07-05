import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useMarkedQuestions() {
  const queryClient = useQueryClient();
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());

  // Fetch marked questions
  const { data: markedQuestionsData = [] } = useQuery<Question[]>({
    queryKey: ['/api/marked-questions'],
  });

  // Fetch marked questions count
  const { data: markedQuestionsCount } = useQuery<{ count: number }>({
    queryKey: ['/api/marked-questions/count'],
  });

  // Toggle mark mutation
  const toggleMarkMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const res = await apiRequest('POST', '/api/marked-questions', { questionId });
      return res.json();
    },
    onSuccess: (data, questionId) => {
      // Update local state
      const newMarkedQuestions = new Set(markedQuestions);
      if (data.marked) {
        newMarkedQuestions.add(questionId);
      } else {
        newMarkedQuestions.delete(questionId);
      }
      setMarkedQuestions(newMarkedQuestions);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/marked-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marked-questions/count'] });
    }
  });

  // Check if question is marked
  const isQuestionMarked = (questionId: number): boolean => {
    return markedQuestionsData.some(q => q.id === questionId) || markedQuestions.has(questionId);
  };

  // Toggle mark function
  const toggleMark = (questionId: number) => {
    toggleMarkMutation.mutate(questionId);
  };

  return {
    markedQuestionsData,
    markedQuestionsCount: markedQuestionsCount?.count || 0,
    isQuestionMarked,
    toggleMark,
    isToggling: toggleMarkMutation.isPending
  };
}