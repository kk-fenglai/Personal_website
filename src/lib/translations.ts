export type Locale = "zh" | "en";

export const translations: Record<
  Locale,
  Record<string, string>
> = {
  zh: {
    "nav.siteName": "等风来的小站",
    "nav.home": "首页",
    "nav.thoughts": "随想",
    "nav.gallery": "相册",
    "nav.admin": "管理",
    "nav.language": "语言",
    "nav.season": "季节",
    "footer.rights": "保留所有权利",
    "footer.backToTop": "回到顶部",

    "home.title": "等风来",
    "home.subtitle": "留白与沉吟",
    "home.intro": "这里是停顿与记录。随想、相册，或藏或显，皆在静处完成。",
    "home.ctaThoughts": "看看随想",
    "home.ctaGallery": "逛逛相册",
    "home.cardThoughts": "随想",
    "home.cardThoughtsDesc": "写下的思考与感悟，支持评论互动。",
    "home.cardGallery": "相册",
    "home.cardGalleryDesc": "上传的照片，可设为公开或仅自己可见。",
    "home.aboutTitle": "关于这里",
    "home.aboutText": "等风来，是给自己留的一小块地方。写点随想、存些照片，不必给所有人看，但可以给想见的人看。",
    "home.quote": "风会来，或不来。等的时候，正好想想。",
    "home.statsThoughts": "篇随想",
    "home.statsPhotos": "张照片",

    "thoughts.title": "随想",
    "thoughts.subtitle": "记录下来的想法与感悟",
    "thoughts.loading": "加载中…",
    "thoughts.empty": "还没有随想，去管理后台写第一篇吧。",
    "thoughts.commentsCount": "{count} 条评论",

    "thoughtDetail.back": "← 返回随想列表",
    "thoughtDetail.notFound": "这篇随想不存在或未公开。",
    "thoughtDetail.backToList": "返回随想列表",
    "thoughtDetail.comments": "评论",
    "thoughtDetail.author": "昵称",
    "thoughtDetail.authorPlaceholder": "你的昵称",
    "thoughtDetail.comment": "评论",
    "thoughtDetail.commentPlaceholder": "写下你的想法…",
    "thoughtDetail.submit": "发表评论",
    "thoughtDetail.submitting": "发送中…",

    "gallery.title": "相册",
    "gallery.subtitle": "照片与回忆",
    "gallery.loading": "加载中…",
    "gallery.empty": "相册还是空的，去管理后台上传第一张照片吧。",
    "gallery.photoAlt": "照片",

    "admin.title": "管理后台",
    "admin.logout": "退出登录",
    "admin.loginHint": "登录后可发布随想、上传照片并设置公开/私密。",
    "admin.loading": "加载中…",
    "admin.tabThoughts": "随想列表",
    "admin.tabNewThought": "发布随想",
    "admin.tabPhotos": "相册",
    "admin.tabUpload": "上传照片",
    "admin.thoughtsEmpty": "还没有随想，去「发布随想」写一篇吧。",
    "admin.photosEmpty": "相册为空，去「上传照片」添加吧。",
    "admin.visibilityPublic": "公开",
    "admin.visibilityPrivate": "私密",
    "admin.noCaption": "无描述",
    "admin.formTitle": "标题",
    "admin.formContent": "内容",
    "admin.formPublicLabel": "公开（其他人可见）",
    "admin.publish": "发布",
    "admin.publishing": "发布中…",
    "admin.selectImage": "选择图片",
    "admin.captionOptional": "描述（可选）",
    "admin.captionPlaceholder": "给这张照片写句话",
    "admin.upload": "上传",
    "admin.uploading": "上传中…",
    "admin.accessRequests": "访问申请",
    "admin.accessEmpty": "暂无申请",
    "admin.approve": "批准",
    "admin.approved": "已批准",
    "admin.copyLink": "复制访问链接",
    "admin.copyLinkHint": "复制后发给对方，点击即可进入",
    "admin.copied": "已复制",
    "admin.pending": "待审核",
    "admin.rejected": "已拒绝",

    "login.username": "用户名",
    "login.password": "密码",
    "login.submit": "登录",
    "login.submitting": "登录中…",
    "login.failed": "登录失败",

    "common.loading": "加载中…",
    "common.errorNetwork": "网络错误，请重试",

    "verify.title": "申请访问",
    "verify.intro": "本站需要申请访问。填写下方信息提交后，经批准会收到访问链接，点击即可进入。",
    "verify.name": "你的称呼",
    "verify.namePlaceholder": "如何称呼你",
    "verify.contact": "联系方式（选填）",
    "verify.contactPlaceholder": "邮箱或微信等，方便回复",
    "verify.message": "申请理由（选填）",
    "verify.messagePlaceholder": "简单说一下为什么想访问",
    "verify.submit": "提交申请",
    "verify.submitting": "提交中…",
    "verify.submitted": "申请已提交，请等待审核。通过后会把访问链接发给你，点击即可进入。",
    "verify.tokenInvalid": "链接无效或未通过审核",
    "verify.fillName": "请填写称呼",
    "verify.backToApply": "返回申请",
  },
  en: {
    "nav.siteName": "Waiting for the Wind",
    "nav.home": "Home",
    "nav.thoughts": "Thoughts",
    "nav.gallery": "Gallery",
    "nav.admin": "Admin",
    "nav.language": "Language",
    "nav.season": "Season",
    "footer.rights": "All rights reserved",
    "footer.backToTop": "Back to top",

    "home.title": "Waiting for the Wind",
    "home.subtitle": "Stillness and reflection",
    "home.intro": "A place to pause and record. Thoughts, photos—shared or kept—all gathered in quiet.",
    "home.ctaThoughts": "Read thoughts",
    "home.ctaGallery": "Browse gallery",
    "home.cardThoughts": "Thoughts",
    "home.cardThoughtsDesc": "Ideas and reflections, with comments.",
    "home.cardGallery": "Gallery",
    "home.cardGalleryDesc": "Photos I've shared, public or private.",
    "home.aboutTitle": "About",
    "home.aboutText": "A small corner of the web. Thoughts and photos—not for everyone, but for those who find their way here.",
    "home.quote": "The wind may come, or not. While waiting, there's time to think.",
    "home.statsThoughts": "thoughts",
    "home.statsPhotos": "photos",

    "thoughts.title": "Thoughts",
    "thoughts.subtitle": "Ideas and reflections",
    "thoughts.loading": "Loading…",
    "thoughts.empty": "No thoughts yet. Write your first one in the admin.",
    "thoughts.commentsCount": "{count} comment(s)",

    "thoughtDetail.back": "← Back to thoughts",
    "thoughtDetail.notFound": "This thought doesn't exist or isn't public.",
    "thoughtDetail.backToList": "Back to thoughts",
    "thoughtDetail.comments": "Comments",
    "thoughtDetail.author": "Name",
    "thoughtDetail.authorPlaceholder": "Your name",
    "thoughtDetail.comment": "Comment",
    "thoughtDetail.commentPlaceholder": "Share your thoughts…",
    "thoughtDetail.submit": "Post comment",
    "thoughtDetail.submitting": "Sending…",

    "gallery.title": "Gallery",
    "gallery.subtitle": "Photos and memories",
    "gallery.loading": "Loading…",
    "gallery.empty": "The gallery is empty. Upload your first photo in the admin.",
    "gallery.photoAlt": "Photo",

    "admin.title": "Admin",
    "admin.logout": "Log out",
    "admin.loginHint": "Log in to post thoughts, upload photos, and set visibility.",
    "admin.loading": "Loading…",
    "admin.tabThoughts": "Thoughts",
    "admin.tabNewThought": "New thought",
    "admin.tabPhotos": "Gallery",
    "admin.tabUpload": "Upload photo",
    "admin.thoughtsEmpty": "No thoughts yet. Go to « New thought » to write one.",
    "admin.photosEmpty": "Gallery is empty. Go to « Upload photo » to add some.",
    "admin.visibilityPublic": "Public",
    "admin.visibilityPrivate": "Private",
    "admin.noCaption": "No caption",
    "admin.formTitle": "Title",
    "admin.formContent": "Content",
    "admin.formPublicLabel": "Public (visible to others)",
    "admin.publish": "Publish",
    "admin.publishing": "Publishing…",
    "admin.selectImage": "Choose image",
    "admin.captionOptional": "Caption (optional)",
    "admin.captionPlaceholder": "Add a caption for this photo",
    "admin.upload": "Upload",
    "admin.uploading": "Uploading…",
    "admin.accessRequests": "Access requests",
    "admin.accessEmpty": "No requests yet",
    "admin.approve": "Approve",
    "admin.approved": "Approved",
    "admin.copyLink": "Copy access link",
    "admin.copyLinkHint": "Send to the user; they click to enter",
    "admin.copied": "Copied",
    "admin.pending": "Pending",
    "admin.rejected": "Rejected",

    "login.username": "Username",
    "login.password": "Password",
    "login.submit": "Log in",
    "login.submitting": "Logging in…",
    "login.failed": "Login failed",

    "common.loading": "Loading…",
    "common.errorNetwork": "Network error, please try again.",

    "verify.title": "Request access",
    "verify.intro": "This site requires approval. Submit the form below; once approved, you'll receive a link to enter.",
    "verify.name": "Your name",
    "verify.namePlaceholder": "What should we call you",
    "verify.contact": "Contact (optional)",
    "verify.contactPlaceholder": "Email or other",
    "verify.message": "Why you'd like access (optional)",
    "verify.messagePlaceholder": "A short note",
    "verify.submit": "Submit request",
    "verify.submitting": "Submitting…",
    "verify.submitted": "Request submitted. Once approved, you'll receive a link—click it to enter.",
    "verify.tokenInvalid": "Link invalid or not yet approved",
    "verify.fillName": "Please enter your name",
    "verify.backToApply": "Back to apply",
  },
};

const STORAGE_KEY = "locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh";
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored === "zh" || stored === "en") return stored;
  return "zh";
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const text = translations[locale][key] ?? translations.zh[key] ?? key;
  if (!params) return text;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    text
  );
}

export const localeLabels: Record<Locale, string> = {
  zh: "中文",
  en: "English",
};

export const dateLocales: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
};
