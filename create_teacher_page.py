#!/usr/bin/env python3
# -*- coding: utf-8 -*-

content = """'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Users, TrendingUp, PlusCircle } from 'lucide-react'
import api from '@/lib/api'

interface RecentExam {
  id: string
  title: string
  subject: string
  participants: number
  date: string
}

interface RecentResult {
  studentName: string
  studentId: string
  examTitle: string
  score: number
  submittedAt: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [recentExams, setRecentExams] = useState<RecentExam[]>([])
  const [recentResults, setRecentResults] = useState<RecentResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role.toLowerCase() !== 'teacher') {
      router.push('/login')
      return
    }

    loadDashboardData()
  }, [isAuthenticated, user, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const examsData = await api.getExams()
      console.log('Teacher exams:', examsData)

      const sortedExams = [...examsData].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5)

      const transformedExams = sortedExams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        subject: exam.subject || 'N/A',
        participants: exam._count?.attempts || 0,
        date: exam.createdAt
      }))

      setRecentExams(transformedExams)

      const allAttempts = []
      for (const exam of examsData) {
        try {
          const examAttempts = await api.getExamAttempts(exam.id)
          allAttempts.push(...examAttempts.map((attempt) => ({
            ...attempt,
            examTitle: exam.title
          })))
        } catch (error) {
          console.error(`Error loading attempts for exam ${exam.id}:`, error)
        }
      }

      console.log('All attempts:', allAttempts)

      const recentAttempts = allAttempts
        .filter((attempt) => attempt.submittedAt)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 10)

      const transformedResults = recentAttempts.map((attempt) => ({
        studentName: attempt.student?.name || 'Unknown',
        studentId: attempt.student?.username || 'N/A',
        examTitle: attempt.examTitle,
        score: attempt.score || 0,
        submittedAt: attempt.submittedAt
      }))

      setRecentResults(transformedResults)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setRecentExams([])
      setRecentResults([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  const totalParticipants = recentExams.reduce((sum, exam) => sum + exam.participants, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hello, {user?.name || 'Teacher'}!</h1>
        <p className="text-gray-600 mt-1">Overview of your teaching activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => router.push('/teacher/create')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Create New Exam</p>
                <p className="text-2xl font-bold">Create Now</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <PlusCircle className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{recentExams.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">New Results</p>
                <p className="text-2xl font-bold text-gray-900">{recentResults.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Student Participants</p>
                <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Exams</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/teacher/manage')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentExams.length > 0 ? (
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{exam.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {exam.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {exam.participants} students
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(exam.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No exams yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Results</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/teacher/results')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map((result) => (
                  <div key={result.studentId + result.submittedAt} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{result.studentName}</p>
                      <p className="text-sm text-gray-600">{result.examTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDateTime(result.submittedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                        {result.score.toFixed(1)}/100
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No new results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
"""

with open('frontend/src/app/(dashboard)/teacher/page.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("File created successfully!")
