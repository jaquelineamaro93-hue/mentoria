export type LearningCourse = { id:string; title:string; description:string; category:string; cover_url:string; required_module:string|null; published:boolean; position:number };
export type LearningLesson = { id:string; course_id:string; module_title:string; title:string; summary:string; duration_minutes:number; position:number; published:boolean };
export type LearningProgress = { lesson_id:string; position_seconds:number; completed_at:string|null; updated_at:string; reflection?:string };
export type LessonDetail = LearningLesson & { body:string; exercise:string; quiz_question:string; quiz_options:string[]; material_url:string; media:{kind:'video'|'iframe';url:string}|null };
export const LESSON_COLUMNS = 'id,course_id,module_title,title,summary,duration_minutes,position,published';
