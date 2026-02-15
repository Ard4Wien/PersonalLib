"use client";

import { useEffect, useState } from "react";
import { MediaGrid, MediaSearch, DeleteConfirmDialog } from "@/components/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Check, Clock, Heart, Loader2, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import AnimatedPage from "@/components/layout/animated-page";
import { useSearch } from "@/contexts/search-context";

interface UserBook {
    id: string;
    mediaId: string;
    title: string;
    subtitle: string;
    image: string | null;
    coverImage?: string | null; // Compatibility
    type: "book";
    status: string;
    isFavorite: boolean;
    genre?: string | null;
    updatedAt: string;
    // For backward compatibility during transition
    book?: {
        id: string;
        title: string;
        author: string;
        coverImage: string | null;
        genre: string | null;
    };
}

export default function BooksPage() {
    const [books, setBooks] = useState<UserBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [editingBook, setEditingBook] = useState<UserBook | null>(null);
    const [addStatus, setAddStatus] = useState("WISHLIST");
    const [editStatus, setEditStatus] = useState("WISHLIST");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { searchQuery } = useSearch();

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const response = await fetch("/api/books");
            if (response.ok) {
                const data = await response.json();
                setBooks(data);
            }
        } catch (error) {
            console.error("Kitaplar yüklenemedi:", error);
            toast.error("Kitaplar yüklenirken bir hata oluştu");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBook = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get("title") as string,
            author: formData.get("author") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
            status: addStatus,
        };

        try {
            const response = await fetch("/api/books", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newBook = await response.json();
                setBooks((prev) => [newBook, ...prev]);
                setIsDialogOpen(false);
                setAddStatus("WISHLIST");
                toast.success("Kitap başarıyla eklendi!");
            } else {
                const error = await response.json();
                const errorMessage = typeof error.error === 'string'
                    ? error.error
                    : Array.isArray(error.error)
                        ? error.error.join(', ')
                        : typeof error.error === 'object'
                            ? Object.values(error.error).flat().join(', ')
                            : "Kitap eklenemedi";
                toast.error(errorMessage);
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditBook = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingBook) return;
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            userBookId: editingBook.id,
            bookId: editingBook.mediaId || editingBook.book?.id,
            title: formData.get("title") as string,
            author: formData.get("author") as string,
            coverImage: formData.get("coverImage") as string,
            genre: formData.get("genre") as string,
            status: editStatus,
        };

        try {
            const response = await fetch("/api/books", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const updatedBook = await response.json();
                setBooks((prev) =>
                    prev.map((b) => (b.id === editingBook.id ? updatedBook : b))
                );
                setIsEditDialogOpen(false);
                setEditingBook(null);
                toast.success("Kitap güncellendi!");
            } else {
                const error = await response.json();
                const errorMessage = typeof error.error === 'string'
                    ? error.error
                    : Array.isArray(error.error)
                        ? error.error.join(', ')
                        : typeof error.error === 'object'
                            ? Object.values(error.error).flat().join(', ')
                            : "Kitap güncellenemedi";
                toast.error(errorMessage);
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFavoriteToggle = async (userBookId: string) => {
        const book = books.find((b) => b.id === userBookId);
        if (!book) return;

        const newFavoriteStatus = !book.isFavorite;

        try {
            const response = await fetch("/api/books", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userBookId, isFavorite: newFavoriteStatus }),
            });

            if (response.ok) {
                setBooks((prev) =>
                    prev.map((b) => (b.id === userBookId ? { ...b, isFavorite: newFavoriteStatus } : b))
                );
                toast.success(newFavoriteStatus ? "Favorilere eklendi" : "Favorilerden çıkarıldı", {
                    icon: <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />,
                });
            }
        } catch {
            toast.error("İşlem başarısız oldu");
        }
    };

    const handleStatusChange = async (userBookId: string, status: string) => {
        try {
            const response = await fetch("/api/books", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userBookId, status }),
            });

            if (response.ok) {
                setBooks((prev) =>
                    prev.map((b) => (b.id === userBookId ? { ...b, status } : b))
                );
                toast.success("Durum güncellendi");
            }
        } catch {
            toast.error("Durum güncellenemedi");
        }
    };

    const handleEdit = (userBookId: string) => {
        const book = books.find((b) => b.id === userBookId);
        if (book) {
            setEditingBook(book);
            setEditStatus(book.status);
            setIsEditDialogOpen(true);
        }
    };

    const handleDelete = (userBookId: string) => {
        setIdToDelete(userBookId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/books?id=${idToDelete}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setBooks((prev) => prev.filter((b) => b.id !== idToDelete));
                toast.success("Kitap kaldırıldı");
                setIsDeleteDialogOpen(false);
                setIdToDelete(null);
            }
        } catch {
            toast.error("Kitap kaldırılamadı");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredBooks = books.filter((b) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                b.title.toLowerCase().includes(query) ||
                b.subtitle.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        // Tab filter
        if (activeTab === "all") return true;
        if (activeTab === "reading") return b.status === "READING";
        if (activeTab === "completed") return b.status === "COMPLETED";
        if (activeTab === "wishlist") return b.status === "WISHLIST";
        return true;
    }).sort((a, b) => {
        if (a.isFavorite === b.isFavorite) {
            return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
        return a.isFavorite ? -1 : 1;
    });

    const mediaItems = filteredBooks.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        coverImage: b.image || b.coverImage,
        type: "book" as const,
        status: b.status,
        isFavorite: b.isFavorite,
        genre: b.genre || b.book?.genre,
        href: `#`,
    }));

    const statusOptions = [
        { value: "WISHLIST", label: "İstek Listesi", icon: Heart, color: "text-purple-400" },
        { value: "READING", label: "Okunuyor", icon: Clock, color: "text-blue-400" },
        { value: "COMPLETED", label: "Okundu", icon: Check, color: "text-green-400" },
        { value: "DROPPED", label: "Bırakıldı", icon: X, color: "text-red-400" },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <AnimatedPage className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shrink-0">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground line-clamp-1">Kitaplarım</h1>
                        <p className="text-muted-foreground text-xs md:text-sm">
                            {books.length} kitap kütüphanenizde
                        </p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs md:text-sm px-3 md:px-4">
                            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            Kitap Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-foreground dark:text-white">Yeni Kitap Ekle</DialogTitle>
                            <DialogDescription className="sr-only">
                                Kütüphanenize eklemek için yeni bir kitap arayın veya manuel olarak ekleyin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2 border-b border-white/5 mb-4">
                            <MediaSearch
                                type="book"
                                onSelect={(item: any) => {
                                    const form = document.getElementById("add-book-form") as HTMLFormElement;
                                    if (form) {
                                        (form.elements.namedItem("title") as HTMLInputElement).value = item.title || "";
                                        (form.elements.namedItem("author") as HTMLInputElement).value = item.author || "";
                                        (form.elements.namedItem("coverImage") as HTMLInputElement).value = item.coverImage || "";
                                        (form.elements.namedItem("genre") as HTMLInputElement).value = item.genre || "";
                                    }
                                    toast.success("Bilgiler dolduruldu!");
                                }}
                            />
                        </div>

                        <form id="add-book-form" onSubmit={handleAddBook} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-muted-foreground">Kitap Adı *</Label>
                                    <Input id="title" name="title" required placeholder="Örn: Suç ve Ceza" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="author" className="text-muted-foreground">Yazar *</Label>
                                    <Input id="author" name="author" required placeholder="Örn: Fyodor Dostoyevski" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coverImage" className="text-muted-foreground">Kapak Görseli URL</Label>
                                <Input id="coverImage" name="coverImage" type="url" placeholder="https://..." className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="genre" className="text-muted-foreground">Tür</Label>
                                <Input id="genre" name="genre" placeholder="Örn: Roman" className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Durum</Label>
                                <Select value={addStatus} onValueChange={setAddStatus}>
                                    <SelectTrigger className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                                        {statusOptions.slice(0, 3).map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="text-foreground dark:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`h-4 w-4 ${option.color}`} />
                                                        <span>{option.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-pink-600">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ekleniyor...</> : "Ekle"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingBook(null); }}>
                <DialogContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground dark:text-white">Kitabı Düzenle</DialogTitle>
                        <DialogDescription className="sr-only">
                            Seçili kitabın bilgilerini ve okuma durumunu güncelleyin.
                        </DialogDescription>
                    </DialogHeader>
                    {editingBook && (
                        <form onSubmit={handleEditBook} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title" className="text-muted-foreground">Kitap Adı *</Label>
                                <Input id="edit-title" name="title" required defaultValue={editingBook.title} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-author" className="text-muted-foreground">Yazar *</Label>
                                <Input id="edit-author" name="author" required defaultValue={editingBook.subtitle} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-coverImage" className="text-muted-foreground">Kapak Görseli URL</Label>
                                <Input id="edit-coverImage" name="coverImage" type="url" defaultValue={editingBook.image || editingBook.coverImage || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-genre" className="text-muted-foreground">Tür</Label>
                                <Input id="edit-genre" name="genre" defaultValue={editingBook.genre || editingBook.book?.genre || ""} className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Durum</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className="bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-950/95 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-2xl">
                                        {statusOptions.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="text-foreground dark:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`h-4 w-4 ${option.color}`} />
                                                        <span>{option.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Güncelleniyor...</> : "Güncelle"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Tabs & Controls */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <TabsList className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 w-full sm:w-auto justify-start overflow-x-auto">
                        <TabsTrigger value="all" className="flex-1 sm:flex-none data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs md:text-sm text-muted-foreground hover:text-foreground">Tümü</TabsTrigger>
                        <TabsTrigger value="reading" className="flex-1 sm:flex-none data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm text-muted-foreground hover:text-foreground">Okunuyor</TabsTrigger>
                        <TabsTrigger value="completed" className="flex-1 sm:flex-none data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs md:text-sm text-muted-foreground hover:text-foreground">Okundu</TabsTrigger>
                        <TabsTrigger value="wishlist" className="flex-1 sm:flex-none data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs md:text-sm text-muted-foreground hover:text-foreground">İstek</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-6">
                    <MediaGrid
                        items={mediaItems}
                        onStatusChange={handleStatusChange}
                        onFavoriteToggle={handleFavoriteToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        emptyMessage="Henüz kitap eklenmemiş"
                    />
                </TabsContent>
            </Tabs>

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Kitabı Kaldır"
                description="Bu kitabı kütüphanenizden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz."
                isLoading={isDeleting}
            />
        </AnimatedPage>
    );
}
