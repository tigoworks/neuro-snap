-- 成长周期和未来成就预测知识库数据插入脚本
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

-- 插入成长周期和发展理论相关知识
INSERT INTO public.knowledge_base (title, content, model_tag, source_type) VALUES

-- 1. Super的生涯发展阶段理论
('Super生涯发展阶段理论', 
'{"title":"Super生涯发展阶段理论","description":"Donald Super提出的职业生涯发展五阶段理论","stages":[{"name":"成长期","age":"0-14岁","characteristics":"形成自我概念，发展兴趣和能力","tasks":"探索自我，培养基本技能"},{"name":"探索期","age":"15-24岁","characteristics":"尝试不同角色，确定职业方向","tasks":"职业探索，技能发展，初步职业选择"},{"name":"建立期","age":"25-44岁","characteristics":"确立职业地位，追求稳定发展","tasks":"职业稳定，技能精进，职位晋升"},{"name":"维持期","age":"45-64岁","characteristics":"保持职业成就，传承经验","tasks":"维持地位，指导他人，知识传承"},{"name":"衰退期","age":"65岁以后","characteristics":"逐步退出职业活动","tasks":"退休准备，生活调整"}],"applications":"用于分析个体当前所处的职业发展阶段，预测下一阶段的发展需求和挑战"}', 
'growth_cycle', 'theory'),

-- 2. Levinson成人发展理论
('Levinson成人发展理论', 
'{"title":"Levinson成人发展理论","description":"Daniel Levinson的成人生命结构发展理论","phases":[{"name":"成年早期","age":"17-45岁","characteristics":"建立生活结构，追求梦想","transitions":["17-22岁：成年早期过渡","28-33岁：30岁过渡","40-45岁：中年过渡"]},{"name":"成年中期","age":"40-65岁","characteristics":"重新评估生活，寻求意义","transitions":["40-45岁：中年过渡","50-55岁：50岁过渡","60-65岁：晚年过渡"]},{"name":"成年晚期","age":"60岁以后","characteristics":"智慧整合，生命回顾","transitions":["60-65岁：晚年过渡"]}],"applications":"帮助理解个体在不同年龄段的心理发展特点和转换期挑战"}', 
'growth_cycle', 'theory'),

-- 3. 职业锚理论
('Schein职业锚理论', 
'{"title":"Schein职业锚理论","description":"Edgar Schein提出的职业锚概念，描述个体职业发展的核心驱动力","anchors":[{"name":"技术/功能型","description":"专注于技术专长和专业能力","characteristics":"追求专业精通，重视技术挑战","development":"深度专业化，成为领域专家"},{"name":"管理型","description":"追求管理责任和领导地位","characteristics":"善于协调资源，喜欢承担责任","development":"管理技能提升，领导力发展"},{"name":"自主/独立型","description":"追求工作自主权和独立性","characteristics":"不喜欢受约束，重视自由度","development":"创业或自由职业，独立工作"},{"name":"安全/稳定型","description":"追求工作和生活的稳定性","characteristics":"风险厌恶，重视保障","development":"稳定职业发展，长期规划"},{"name":"创业型","description":"追求创新和创业机会","characteristics":"喜欢挑战，敢于冒险","development":"创业创新，开拓新领域"},{"name":"服务/奉献型","description":"追求为社会做贡献","characteristics":"价值驱动，社会责任感强","development":"公益事业，社会影响力"},{"name":"挑战型","description":"追求困难挑战和竞争","characteristics":"喜欢解决难题，竞争意识强","development":"高难度项目，竞争性环境"},{"name":"生活方式型","description":"追求工作与生活的平衡","characteristics":"重视生活质量，平衡发展","development":"灵活工作，生活优先"}],"applications":"识别个体的核心职业驱动力，预测长期职业发展方向"}', 
'growth_cycle', 'theory'),

-- 4. 成就动机理论
('McClelland成就动机理论', 
'{"title":"McClelland成就动机理论","description":"David McClelland的三需要理论，解释个体成就动机的来源","needs":[{"name":"成就需要(nAch)","description":"追求卓越和成功的动机","characteristics":"设定挑战性目标，承担适度风险，寻求反馈","high_achievers":"企业家，销售人员，项目经理","development":"设定具体目标，获得及时反馈，承担个人责任"},{"name":"权力需要(nPow)","description":"影响和控制他人的动机","characteristics":"寻求影响力，喜欢竞争，关注声望","high_power":"管理者，政治家，领导者","development":"领导技能培养，影响力扩大，权威建立"},{"name":"亲和需要(nAff)","description":"建立友好关系的动机","characteristics":"寻求归属感，避免冲突，重视合作","high_affiliation":"团队成员，咨询师，人力资源","development":"人际技能提升，团队协作，关系建设"}],"applications":"分析个体的核心动机类型，预测在不同环境下的表现和发展潜力"}', 
'future_achievements', 'theory'),

-- 5. 多元智能理论
('Gardner多元智能理论', 
'{"title":"Gardner多元智能理论","description":"Howard Gardner提出的八种智能类型理论","intelligences":[{"name":"语言智能","description":"运用语言表达和理解的能力","careers":"作家，记者，律师，教师","development":"阅读写作，演讲辩论，语言学习"},{"name":"逻辑数学智能","description":"逻辑推理和数学运算的能力","careers":"科学家，工程师，会计师，程序员","development":"逻辑训练，数学学习，科学研究"},{"name":"空间智能","description":"感知和操作空间关系的能力","careers":"建筑师，艺术家，飞行员，外科医生","development":"空间训练，艺术创作，设计实践"},{"name":"音乐智能","description":"感知和创造音乐的能力","careers":"音乐家，作曲家，音响师","development":"音乐学习，节奏训练，创作实践"},{"name":"身体运动智能","description":"运用身体表达和运动的能力","careers":"运动员，舞蹈家，外科医生","development":"体育锻炼，技能训练，身体协调"},{"name":"人际智能","description":"理解和与他人互动的能力","careers":"销售员，咨询师，政治家，教师","development":"社交技能，沟通训练，团队合作"},{"name":"内省智能","description":"了解和反思自我的能力","careers":"心理学家，哲学家，作家","development":"自我反思，冥想练习，内在探索"},{"name":"自然智能","description":"观察和理解自然的能力","careers":"生物学家，环保专家，农学家","development":"自然观察，环境学习，生态研究"}],"applications":"识别个体的优势智能领域，预测在相关领域的成就潜力"}', 
'future_achievements', 'theory'),

-- 6. 发展路径规划理论
('职业发展路径理论', 
'{"title":"职业发展路径理论","description":"系统性的职业发展路径规划方法","pathways":[{"name":"专业技术路径","description":"深度专业化发展","stages":["初级专员→中级专员→高级专员→专家→首席专家"],"timeline":"5-15年","requirements":"专业技能，持续学习，技术创新"},{"name":"管理领导路径","description":"管理职责递增发展","stages":["团队成员→组长→主管→经理→总监→VP"],"timeline":"8-20年","requirements":"领导技能，团队管理，战略思维"},{"name":"创业创新路径","description":"创业和创新发展","stages":["员工→项目负责人→内部创业→独立创业→企业家"],"timeline":"5-10年","requirements":"创新能力，风险承担，资源整合"},{"name":"跨界复合路径","description":"多领域综合发展","stages":["单一技能→复合技能→跨界专家→行业顾问"],"timeline":"10-15年","requirements":"学习能力，适应性，整合思维"}],"factors":[{"name":"关键技能","description":"每个阶段需要掌握的核心技能"},{"name":"经验积累","description":"必要的工作经验和项目历练"},{"name":"人脉网络","description":"职业发展所需的关系网络"},{"name":"机会窗口","description":"行业和市场的发展机遇"}],"applications":"为个体规划具体的职业发展路径和时间节点"}', 
'development_pathway', 'theory'),

-- 7. 风险识别与管理
('职业发展风险管理', 
'{"title":"职业发展风险管理","description":"识别和管理职业发展中的潜在风险","risk_categories":[{"name":"技能风险","description":"技能过时或不足的风险","examples":["技术更新换代","行业转型","新技能需求"],"mitigation":["持续学习","技能更新","跨领域发展"]},{"name":"市场风险","description":"行业和市场变化的风险","examples":["行业衰退","市场饱和","经济周期"],"mitigation":["行业多元化","市场敏感度","转型准备"]},{"name":"组织风险","description":"组织变化对个人的影响","examples":["公司重组","裁员风险","文化冲突"],"mitigation":["多元化发展","网络建设","适应能力"]},{"name":"个人风险","description":"个人因素导致的风险","examples":["健康问题","家庭变化","动机下降"],"mitigation":["健康管理","生活平衡","目标调整"]}],"assessment_methods":["SWOT分析","风险矩阵","情景规划","压力测试"],"applications":"帮助个体识别潜在风险，制定应对策略"}', 
'development_pathway', 'theory'),

-- 8. 成功预测模型
('职业成功预测模型', 
'{"title":"职业成功预测模型","description":"基于多因素的职业成功预测框架","success_dimensions":[{"name":"客观成功","indicators":["薪资水平","职位等级","社会地位","财富积累"],"measurement":"量化指标，外在表现"},{"name":"主观成功","indicators":["工作满意度","生活平衡","个人成长","价值实现"],"measurement":"个人感受，内在体验"}],"predictive_factors":[{"category":"个人特质","factors":["智力水平","人格特征","价值观念","动机强度"],"weight":"30%"},{"category":"能力技能","factors":["专业技能","通用技能","学习能力","创新能力"],"weight":"25%"},{"category":"经验背景","factors":["教育背景","工作经验","项目经历","国际经验"],"weight":"20%"},{"category":"环境机遇","factors":["行业前景","公司平台","导师支持","网络资源"],"weight":"15%"},{"category":"行为表现","factors":["工作绩效","领导行为","团队合作","持续学习"],"weight":"10%"}],"prediction_timeline":[{"period":"1-2年","accuracy":"85%","focus":"短期目标实现"},{"period":"3-5年","accuracy":"70%","focus":"中期发展轨迹"},{"period":"5-10年","accuracy":"55%","focus":"长期成就潜力"},{"period":"职业生涯","accuracy":"40%","focus":"巅峰成就预测"}],"applications":"为个体提供科学的成功概率评估和发展建议"}', 
'future_achievements', 'theory'),

-- 9. 时间管理与节点规划
('职业发展时间管理', 
'{"title":"职业发展时间管理","description":"基于生命周期的职业发展时间规划","life_phases":[{"name":"20-30岁：探索建立期","focus":"技能积累，经验获取","key_tasks":["专业技能培养","工作经验积累","人脉网络建设","职业方向确定"],"time_allocation":"学习40%，工作50%，网络10%"},{"name":"30-40岁：发展上升期","focus":"职业突破，成就积累","key_tasks":["核心竞争力建设","领导能力发展","重要项目主导","行业影响力建设"],"time_allocation":"工作60%，学习25%，领导15%"},{"name":"40-50岁：成熟稳定期","focus":"价值创造，经验传承","key_tasks":["战略思维发展","团队建设管理","知识经验传承","社会影响力扩大"],"time_allocation":"管理50%，创新30%，传承20%"},{"name":"50-60岁：智慧贡献期","focus":"智慧分享，社会贡献","key_tasks":["行业专家地位","导师角色发挥","社会责任承担","财富传承规划"],"time_allocation":"指导40%，贡献35%，传承25%"}],"milestone_planning":[{"type":"技能里程碑","examples":["专业认证获得","核心技能掌握","跨界能力发展"]},{"type":"职位里程碑","examples":["首次管理职位","部门负责人","高级管理层"]},{"type":"成就里程碑","examples":["重要项目成功","行业奖项获得","专业声誉建立"]},{"type":"影响里程碑","examples":["团队建设成功","行业标准制定","社会影响创造"]}],"applications":"帮助个体制定基于时间轴的职业发展规划"}', 
'development_pathway', 'theory'),

-- 10. 潜力评估框架
('个人潜力评估框架', 
'{"title":"个人潜力评估框架","description":"全面评估个体发展潜力的系统方法","assessment_dimensions":[{"name":"认知潜力","components":["学习能力","问题解决","创新思维","战略思考"],"indicators":["学习速度","理解深度","创意产出","决策质量"],"measurement":"认知测试，案例分析，创新项目"},{"name":"情感潜力","components":["情绪智力","人际技能","影响力","韧性"],"indicators":["情绪管理","关系建设","说服能力","压力承受"],"measurement":"360度评估，情境模拟，压力测试"},{"name":"行为潜力","components":["执行力","领导力","适应性","持续性"],"indicators":["目标达成","团队影响","变化适应","长期坚持"],"measurement":"绩效记录，行为观察，长期跟踪"},{"name":"动机潜力","components":["成就动机","成长意愿","价值驱动","目标导向"],"indicators":["挑战寻求","学习投入","价值一致","目标坚持"],"measurement":"动机测试，价值评估，目标分析"}],"potential_levels":[{"level":"高潜力","score":"80-100","characteristics":"全面优秀，发展空间大","development":"快速晋升，重点培养"},{"level":"中高潜力","score":"60-79","characteristics":"某些方面突出，有发展空间","development":"针对性培养，专业发展"},{"level":"中等潜力","score":"40-59","characteristics":"基础良好，需要努力","development":"技能提升，经验积累"},{"level":"待发展潜力","score":"20-39","characteristics":"基础薄弱，需要大量投入","development":"基础培训，长期规划"}],"applications":"科学评估个体在不同领域的发展潜力，制定个性化发展策略"}', 
'future_achievements', 'theory'); 