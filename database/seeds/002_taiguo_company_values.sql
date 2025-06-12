-- 钛果公司价值观数据插入脚本
-- 确保 knowledge_base 表存在
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  content text,
  model_tag text,
  source_type text DEFAULT 'static',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT knowledge_base_pkey PRIMARY KEY (id)
);

-- 创建索引（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_base_model_tag') THEN
    CREATE INDEX idx_knowledge_base_model_tag ON knowledge_base(model_tag);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_base_source_type') THEN
    CREATE INDEX idx_knowledge_base_source_type ON knowledge_base(source_type);
  END IF;
END $$;

-- 插入钛果公司价值观数据
INSERT INTO public.knowledge_base (title, content, model_tag, source_type) VALUES
-- 1. 客户情绪为先
('钛果 - 客户情绪为先', 
'{"title":"客户情绪为先","description":"营造一个良好的合作关系，追求初期良好的合作意愿度","whatIs":"良好的客户情绪是建立合作意愿度的开端","whyImportant":"真心实意把客户当朋友","howToDo":"始终以客户情绪为优先考虑","category":"客户关系","keywords":["客户情绪","合作关系","合作意愿","客户优先"]}', 
'company_values', 'company_values'),

-- 2. 合作共赢为本
('钛果 - 合作共赢为本', 
'{"title":"合作共赢为本","description":"建立长期稳定的合作关系，实现多方共赢","whatIs":"以合作共赢为核心理念的商业模式","whyImportant":"只有共赢才能建立长久的合作关系","howToDo":"在每个合作中寻找多方利益平衡点","category":"合作理念","keywords":["合作共赢","长期合作","多方共赢","利益平衡"]}', 
'company_values', 'company_values'),

-- 3. 真实诚信
('钛果 - 真实诚信', 
'{"title":"真实诚信","description":"以诚待人，言行一致，建立可信赖的品牌形象","whatIs":"诚实守信是企业立身之本","whyImportant":"诚信是建立信任关系的基础","howToDo":"在所有商业活动中保持透明和诚实","category":"品德修养","keywords":["真实诚信","言行一致","可信赖","透明诚实"]}', 
'company_values', 'company_values'),

-- 4. 刨根问底
('钛果 - 刨根问底', 
'{"title":"刨根问底","description":"深入思考问题本质，不满足于表面现象","whatIs":"追求问题根本原因的思维方式","whyImportant":"只有找到根本原因才能彻底解决问题","howToDo":"对每个问题都要问为什么，直到找到根本原因","category":"思维方式","keywords":["刨根问底","深入思考","问题本质","根本原因"]}', 
'company_values', 'company_values'),

-- 5. 结果导向
('钛果 - 结果导向', 
'{"title":"结果导向","description":"以最终结果为目标，注重执行效果","whatIs":"以达成目标结果为工作导向","whyImportant":"结果是检验工作成效的唯一标准","howToDo":"制定明确目标，专注执行，确保达成结果","category":"工作方式","keywords":["结果导向","目标达成","执行效果","工作成效"]}', 
'company_values', 'company_values'),

-- 6. 自驱自省
('钛果 - 自驱自省', 
'{"title":"自驱自省","description":"主动承担责任，持续自我反思和改进","whatIs":"自我驱动和自我反省的能力","whyImportant":"自驱自省是个人成长的内在动力","howToDo":"主动设定目标，定期反思总结，持续改进","category":"个人成长","keywords":["自驱自省","主动承担","自我反思","持续改进"]}', 
'company_values', 'company_values'),

-- 7. 乐观勇敢
('钛果 - 乐观勇敢', 
'{"title":"乐观勇敢","description":"保持积极心态，勇于面对挑战","whatIs":"积极乐观的心态和勇于挑战的精神","whyImportant":"乐观勇敢是克服困难的精神力量","howToDo":"面对困难时保持乐观，勇于尝试新的解决方案","category":"心态品质","keywords":["乐观勇敢","积极心态","勇于挑战","克服困难"]}', 
'company_values', 'company_values'),

-- 8. 追求极致
('钛果 - 追求极致', 
'{"title":"追求极致","description":"不断追求完美，力求做到最好","whatIs":"对品质和效果的极致追求","whyImportant":"极致的追求才能创造卓越的成果","howToDo":"在每个细节上都力求完美，不断优化改进","category":"品质追求","keywords":["追求极致","追求完美","卓越成果","细节完美"]}', 
'company_values', 'company_values'),

-- 9. 相信相信
('钛果 - 相信相信', 
'{"title":"相信相信","description":"相信团队，相信未来，相信可能性","whatIs":"对团队和未来的坚定信念","whyImportant":"相信是一切成功的前提","howToDo":"给予团队充分信任，对未来保持信心","category":"信念力量","keywords":["相信相信","团队信任","坚定信念","成功前提"]}', 
'company_values', 'company_values'),

-- 10. 以终为始
('钛果 - 以终为始', 
'{"title":"以终为始","description":"从目标出发，倒推执行路径","whatIs":"以最终目标为起点的思维方式","whyImportant":"明确终点才能找到最佳路径","howToDo":"先确定最终目标，再制定实现路径","category":"目标管理","keywords":["以终为始","目标导向","倒推路径","最佳路径"]}', 
'company_values', 'company_values'),

-- 11. 同心同德
('钛果 - 同心同德', 
'{"title":"同心同德","description":"团队协作，目标一致，共同努力","whatIs":"团队成员心往一处想，劲往一处使","whyImportant":"团结一致是团队成功的关键","howToDo":"建立共同目标，加强沟通协作","category":"团队协作","keywords":["同心同德","团队协作","目标一致","团结一致"]}', 
'company_values', 'company_values'),

-- 12. 正向影响
('钛果 - 正向影响', 
'{"title":"正向影响","description":"传播正能量，产生积极影响","whatIs":"通过自身行为产生正面影响力","whyImportant":"正向影响能够创造更好的环境","howToDo":"以身作则，传播正能量，影响他人","category":"影响力","keywords":["正向影响","正能量","积极影响","以身作则"]}', 
'company_values', 'company_values'),

-- 13. 防区延伸
('钛果 - 防区延伸', 
'{"title":"防区延伸","description":"主动扩大责任范围，承担更多职责","whatIs":"主动承担超出职责范围的工作","whyImportant":"防区延伸体现主人翁精神","howToDo":"主动关注相关领域，承担额外责任","category":"责任担当","keywords":["防区延伸","责任范围","主人翁精神","额外责任"]}', 
'company_values', 'company_values');

-- 验证插入结果
SELECT 
  COUNT(*) as total_values,
  COUNT(CASE WHEN model_tag = 'company_values' THEN 1 END) as company_values_count
FROM public.knowledge_base;

-- 显示插入的钛果价值观
SELECT 
  title,
  model_tag,
  source_type,
  created_at
FROM public.knowledge_base 
WHERE model_tag = 'company_values' 
ORDER BY created_at; 