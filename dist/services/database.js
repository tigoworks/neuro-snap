"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalysisResultByUserId = exports.updateSurveyStatus = exports.saveAnalysisResult = exports.getKnowledgeBaseByModel = exports.getRawAnswersBySurveyId = exports.getSurveyByUserId = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const supabase = (0, supabase_js_1.createClient)(config_1.default.supabase.url, config_1.default.supabase.key);
const getSurveyByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('user_survey')
            .select('*')
            .eq('id', userId)
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        logger_1.default.error('Error fetching survey:', error);
        throw error;
    }
};
exports.getSurveyByUserId = getSurveyByUserId;
const getRawAnswersBySurveyId = async (surveyId) => {
    try {
        const { data, error } = await supabase
            .from('user_survey_answer')
            .select('*')
            .eq('user_survey_id', surveyId);
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        logger_1.default.error('Error fetching raw answers:', error);
        throw error;
    }
};
exports.getRawAnswersBySurveyId = getRawAnswersBySurveyId;
const getKnowledgeBaseByModel = async (modelType) => {
    try {
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('model_tag', modelType);
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        logger_1.default.error('Error fetching knowledge base:', error);
        throw error;
    }
};
exports.getKnowledgeBaseByModel = getKnowledgeBaseByModel;
const saveAnalysisResult = async (result) => {
    try {
        const { data, error } = await supabase
            .from('analysis_results')
            .insert([result])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        logger_1.default.error('Error saving analysis result:', error);
        throw error;
    }
};
exports.saveAnalysisResult = saveAnalysisResult;
const updateSurveyStatus = async (surveyId, status) => {
    try {
        const { data, error } = await supabase
            .from('user_survey')
            .update({ status })
            .eq('id', surveyId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        logger_1.default.error('Error updating survey status:', error);
        throw error;
    }
};
exports.updateSurveyStatus = updateSurveyStatus;
const getAnalysisResultByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('analysis_results')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        logger_1.default.error('Error fetching analysis result:', error);
        throw error;
    }
};
exports.getAnalysisResultByUserId = getAnalysisResultByUserId;
exports.default = {
    getSurveyByUserId: exports.getSurveyByUserId,
    getRawAnswersBySurveyId: exports.getRawAnswersBySurveyId,
    getKnowledgeBaseByModel: exports.getKnowledgeBaseByModel,
    saveAnalysisResult: exports.saveAnalysisResult,
    updateSurveyStatus: exports.updateSurveyStatus,
    getAnalysisResultByUserId: exports.getAnalysisResultByUserId,
};
