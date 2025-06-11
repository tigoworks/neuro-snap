import { createClient } from '@supabase/supabase-js';
import config from '../config';
import logger from '../utils/logger';
import { AnalysisResult } from '../types';

const supabase = createClient(config.supabase.url, config.supabase.key);

export const getSurveyByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_survey')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching survey:', error);
    throw error;
  }
};

export const getRawAnswersBySurveyId = async (surveyId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_survey_answer')
      .select('*')
      .eq('user_survey_id', surveyId);

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching raw answers:', error);
    throw error;
  }
};

export const getKnowledgeBaseByModel = async (modelType: string) => {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('model_tag', modelType);

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching knowledge base:', error);
    throw error;
  }
};

export const saveAnalysisResult = async (result: Partial<AnalysisResult>): Promise<AnalysisResult> => {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .insert([result])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error saving analysis result:', error);
    throw error;
  }
};

export const updateSurveyStatus = async (surveyId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('user_survey')
      .update({ status })
      .eq('id', surveyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating survey status:', error);
    throw error;
  }
};

export const getAnalysisResultByUserId = async (userId: string): Promise<AnalysisResult> => {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching analysis result:', error);
    throw error;
  }
};

export default {
  getSurveyByUserId,
  getRawAnswersBySurveyId,
  getKnowledgeBaseByModel,
  saveAnalysisResult,
  updateSurveyStatus,
  getAnalysisResultByUserId,
}; 