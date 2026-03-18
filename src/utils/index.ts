export function createPageUrl(pageName: string) {
    return '/app/' + pageName.replace(/ /g, '-');
}