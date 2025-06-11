"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const analysis_routes_1 = __importDefault(require("./routes/analysis.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const survey_routes_1 = __importDefault(require("./routes/survey.routes"));
const answer_routes_1 = __importDefault(require("./routes/answer.routes"));
const config_routes_1 = __importDefault(require("./routes/config.routes"));
const test_routes_1 = __importDefault(require("./routes/test.routes"));
const api_routes_1 = __importDefault(require("./routes/api.routes"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.default.cors_origin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.path}`);
    next();
});
// Routes
// Frontend-compatible API routes (priority)
app.use('/api', api_routes_1.default);
// Original backend routes (for backward compatibility)
app.use('/api/analyze', analysis_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/survey', survey_routes_1.default);
app.use('/api/answer', answer_routes_1.default);
app.use('/api/config', config_routes_1.default);
app.use('/api/test', test_routes_1.default);
// Error handling
app.use(error_middleware_1.default.notFoundHandler);
app.use(error_middleware_1.default.errorHandler);
exports.default = app;
