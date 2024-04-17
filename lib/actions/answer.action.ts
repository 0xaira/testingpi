'use server'
import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '../mongoose'
import { CreateAnswerParams, DeleteAnswerParams, GetAnswersParams, GetUserStatsParams } from './shared.types'
import Answer from '@/database/answer.model'
import Question from '@/database/question.model'
import Interaction from '@/database/interaction.model'

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

export async function getUserAnswers (params: GetUserStatsParams) {
  try {
    connectToDatabase()
    const { userId, page = 1, pageSize = 10 } = params

    const totalAnswers = await Answer.countDocuments({ author: userId })

    const userAnswers = await Answer.find({ author: userId })
      .sort({
        upvotes: -1
      })
      .populate('question', 'title')
      .populate('author', '_id clerkId name picture')

    return { totalAnswers, answers: userAnswers }
  } catch (error) {
    console.log(error)
  }
}

// Delete Answer
export async function deleteAnswer (params: DeleteAnswerParams) {
  try {
    connectToDatabase()
    const { answerId, path } = params

    const answer = await Answer.findById(answerId)

    if (!answer) {
      throw new Error(' Answer not found')
    }

    await Answer.deleteOne({ _id: answerId })
    await Question.updateMany(
      { _id: answer.question },
      { $pull: { answers: answerId } }
    )
    await Interaction.deleteMany({ answer: answerId })

    revalidatePath(path)
  } catch (error) {
    console.log(error)
  }
}
