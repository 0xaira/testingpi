'use server'
import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '../mongoose'
import { CreateAnswerParams, GetAnswersParams } from './shared.types'
import Answer from '@/database/answer.model'
import Question from '@/database/question.model'

export async function createAnswer (params: CreateAnswerParams) {
  try {
    await connectToDatabase()

    const { content, author, question, path } = params
    const newAnswer = await Answer.create({
      content,
      author,
      question,
      path
    })

    await Question.findByIdAndUpdate(question, {
      $push: { answers: newAnswer._id }
    })

    // TODO : Add Interactions
    revalidatePath(path)
  } catch (err) {
    console.log(err)
    throw err
  }
}

export async function getAnswers (params: GetAnswersParams) {
  try {
    await connectToDatabase()
    const { questionId } = params

    const answers = await Answer.find({ question: questionId })
      .populate('author', '_id clerkId name picture')
      .sort({ createdAt: -1 })

    return { answers }
  } catch (error) {
    console.log(error)
  }
}
