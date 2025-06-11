-- 1. 启用 UUID 生成扩展
create extension if not exists "pgcrypto";

-- 2. 测评模型表：存放各模块（fiveq、mbti、big5、disc、holland、motivation）
CREATE TABLE IF NOT EXISTS public.survey_model (
  id uuid NOT NULL DEFAULT gen_random_uuid(),      -- 主键：模型 ID
  code text NOT NULL UNIQUE,                       -- 模型编码（如：fiveq、mbti、big5、disc、holland、motivation）
  name text NOT NULL,                              -- 模型名称（中文或英文）
  description text,                                -- 模型描述（可选）
  created_at timestamp with time zone DEFAULT now(),-- 创建时间
  CONSTRAINT survey_model_pkey PRIMARY KEY (id)
);

-- 3. 测评题库表：存放所有题目及其"编号→选项文字"映射
CREATE TABLE IF NOT EXISTS public.survey_question (
  id uuid NOT NULL DEFAULT gen_random_uuid(),      -- 主键：题目 ID
  model_id uuid NOT NULL,                          -- 外键：所属模型
  question_code text NOT NULL,                     -- 题目编码（如：fiveq_q1、mbti_ei_q1、big5_o_q1、disc_d_q1、holland_r_q1、motivation_q1）
  content text NOT NULL,                           -- 题干文字
  options jsonb,                                   -- "编号→文字"映射的 JSON 数组
  type text NOT NULL DEFAULT 'single'::text CHECK (type = ANY (ARRAY['single'::text, 'multiple'::text, 'scale'::text, 'text'::text, 'sorting'::text])),
                                                  -- 题型：  
                                                  --   'single'：单选（前端只会返回 {"choice":code}）  
                                                  --   'multiple'：多选（返回 {"choices":[code,...]}）  
                                                  --   'scale'：打分 1~5（返回 {"score":X}）  
                                                  --   'text'：开放填空（返回 {"text":"用户输入"}）  
                                                  --   'sorting'：拖拽排序（返回 {"order":[code,...]}）  
  sort_order integer DEFAULT 0,                    -- 同模型下排序优先级
  required boolean DEFAULT true,                   -- 是否必答
  CONSTRAINT survey_question_pkey PRIMARY KEY (id),
  CONSTRAINT survey_question_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.survey_model(id)
);

-- 4. 测试结果表：存储所有测试的最终结果
CREATE TABLE IF NOT EXISTS public.test_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),      -- 主键：唯一测试结果 ID
  user_info jsonb NOT NULL,                        -- 用户信息（姓名、性别、年龄等）
  five_questions jsonb NOT NULL,                   -- 五问法结果
  mbti_result jsonb NOT NULL,                      -- MBTI 结果
  big5_result jsonb NOT NULL,                      -- 五大人格结果
  disc_result jsonb NOT NULL,                      -- DISC 结果
  holland_result jsonb NOT NULL,                   -- 霍兰德结果
  values_result jsonb NOT NULL,                    -- 价值观结果
  created_at timestamp with time zone DEFAULT now(),-- 创建时间
  CONSTRAINT test_results_pkey PRIMARY KEY (id)
);

-- 5. 用户基础表：存储第 2 部分"用户信息填写"字段
CREATE TABLE IF NOT EXISTS public.user_survey (
  id uuid NOT NULL DEFAULT gen_random_uuid(),      -- 主键：唯一用户提交 ID
  name text NOT NULL,                              -- 姓名
  gender text DEFAULT 'unknown'::text,             -- 性别（male/female/unknown）
  age integer CHECK (age > 0),                     -- 年龄
  city text,                                       -- 城市（例如：南京）
  occupation text,                                 -- 职业
  education text,                                  -- 学历（本科/硕士/博士）
  phone text,                                      -- 手机号（可选）
  submit_time timestamp with time zone DEFAULT now(),-- 提交时间（带时区）
  CONSTRAINT user_survey_pkey PRIMARY KEY (id)
);

-- 6. 用户回答表：只存编号（code），后续可通过 survey_question.options 映射到文字
CREATE TABLE IF NOT EXISTS public.user_survey_answer (
  id uuid NOT NULL DEFAULT gen_random_uuid(),      -- 回答记录 ID
  user_survey_id uuid NOT NULL,                    -- 外键：对应哪位用户
  question_id uuid NOT NULL,                       -- 外键：哪道题
  model_id uuid NOT NULL,                          -- 外键：对应哪个模型（同 q.model_id 冗余）
  answer jsonb NOT NULL,                           -- 存编号的 JSON
  created_at timestamp with time zone DEFAULT now(),-- 回答时间
  CONSTRAINT user_survey_answer_pkey PRIMARY KEY (id),
  CONSTRAINT user_survey_answer_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.survey_question(id),
  CONSTRAINT user_survey_answer_user_survey_id_fkey FOREIGN KEY (user_survey_id) REFERENCES public.user_survey(id),
  CONSTRAINT user_survey_answer_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.survey_model(id)
);

-- 7. AI 分析结果表：存储 AI 对用户测试结果的分析
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),      -- 主键：分析结果 ID
  user_id uuid NOT NULL,                           -- 外键：关联的用户
  model_code text NOT NULL,                        -- 分析模型，如 GPT-4、Claude
  result_summary text,                             -- 简要总结（AI 生成的分析摘要）
  result_json jsonb,                               -- 完整结构化分析结果（JSON 格式）
  completed_at timestamp with time zone DEFAULT now(),-- 分析完成时间
  CONSTRAINT analysis_results_pkey PRIMARY KEY (id),
  CONSTRAINT analysis_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_survey(id) ON DELETE CASCADE
);

-- 8. 知识库表：存储各类测评模型的理论知识和分析依据
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid(),      -- 主键：知识条目 ID
  title text,                                      -- 知识标题
  content text,                                    -- 知识内容（可以是文本、HTML 或 Markdown）
  model_tag text,                                  -- 适用模型，如 MBTI、DISC、Big5 等
  source_type text DEFAULT 'static',               -- 来源类型：
                                                  --   'static'：静态内容
                                                  --   'vector'：向量数据库内容
                                                  --   'external'：外部 API 内容
  created_at timestamp with time zone DEFAULT now(),-- 创建时间
  CONSTRAINT knowledge_base_pkey PRIMARY KEY (id)
);

-- 创建索引（如果不存在）
DO $$ 
BEGIN
  -- 用户调查表索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_survey_submit_time') THEN
    CREATE INDEX idx_user_survey_submit_time ON user_survey(submit_time);
  END IF;
  
  -- 调查问题表索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_survey_question_model_id') THEN
    CREATE INDEX idx_survey_question_model_id ON survey_question(model_id);
  END IF;
  
  -- 用户回答表索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_survey_answer_user_id') THEN
    CREATE INDEX idx_user_survey_answer_user_id ON user_survey_answer(user_survey_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_survey_answer_question_id') THEN
    CREATE INDEX idx_user_survey_answer_question_id ON user_survey_answer(question_id);
  END IF;
  
  -- 测试结果表索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_test_results_created_at') THEN
    CREATE INDEX idx_test_results_created_at ON test_results(created_at);
  END IF;
  
  -- AI 分析结果表索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analysis_results_user_id') THEN
    CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analysis_results_model_code') THEN
    CREATE INDEX idx_analysis_results_model_code ON analysis_results(model_code);
  END IF;
  
  -- 知识库表索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_base_model_tag') THEN
    CREATE INDEX idx_knowledge_base_model_tag ON knowledge_base(model_tag);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_base_source_type') THEN
    CREATE INDEX idx_knowledge_base_source_type ON knowledge_base(source_type);
  END IF;
END $$;