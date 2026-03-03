export function timeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return formatDate(dateString);
}

export function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function readTimeLabel(minutes: number): string {
	return `${minutes} min read`;
}

export function freshness(dateString: string): 'breaking' | 'today' | 'recent' {
	const date = new Date(dateString);
	const now = new Date();
	const hours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
	if (hours < 2) return 'breaking';
	if (hours < 24) return 'today';
	return 'recent';
}
