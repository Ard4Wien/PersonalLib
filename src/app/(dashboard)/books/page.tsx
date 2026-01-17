"use client";

import { useEffect, useState } from "react";
import { MediaGrid } from "@/components/media";
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
import { BookOpen, Check, Clock, Heart, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import AnimatedPage from "@/components/layout/animated-page";

interface UserBook {
    id: string;
    status: string;
    book: {
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
            bookId: editingBook.book.id,
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

    const handleDelete = async (userBookId: string) => {
        try {
            const response = await fetch(`/api/books?id=${userBookId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setBooks((prev) => prev.filter((b) => b.id !== userBookId));
                toast.success("Kitap kaldırıldı");
            }
        } catch {
            toast.error("Kitap kaldırılamadı");
        }
    };

    const filteredBooks = books.filter((b) => {
        if (activeTab === "all") return true;
        if (activeTab === "reading") return b.status === "READING";
        if (activeTab === "completed") return b.status === "COMPLETED";
        if (activeTab === "wishlist") return b.status === "WISHLIST";
        return true;
    });

    const mediaItems = filteredBooks.map((b) => ({
        id: b.id,
        title: b.book.title,
        subtitle: b.book.author,
        coverImage: b.book.coverImage,
        type: "book" as const,
        status: b.status,
        genre: b.book.genre,
        href: `/books/${b.book.id}`,
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Kitaplarım</h1>
                        <p className="text-gray-400 text-sm">
                            {books.length} kitap kütüphanenizde
                        </p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Kitap Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                        <DialogHeader>
                            <DialogTitle className="text-white">Yeni Kitap Ekle</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Kütüphanenize yeni bir kitap ekleyin
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddBook} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-gray-300">Kitap Adı *</Label>
                                <Input id="title" name="title" required placeholder="Örn: Suç ve Ceza" className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="author" className="text-gray-300">Yazar *</Label>
                                <Input id="author" name="author" required placeholder="Örn: Fyodor Dostoyevski" className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coverImage" className="text-gray-300">Kapak Görseli URL</Label>
                                <Input id="coverImage" name="coverImage" type="url" placeholder="https://..." className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="genre" className="text-gray-300">Tür</Label>
                                <Input id="genre" name="genre" placeholder="Örn: Roman" className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Durum</Label>
                                <Select value={addStatus} onValueChange={setAddStatus}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                                        {statusOptions.slice(0, 3).map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="text-white hover:bg-white/10 focus:bg-white/10"
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
                <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Kitabı Düzenle</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Kitap bilgilerini güncelleyin
                        </DialogDescription>
                    </DialogHeader>
                    {editingBook && (
                        <form onSubmit={handleEditBook} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title" className="text-gray-300">Kitap Adı *</Label>
                                <Input id="edit-title" name="title" required defaultValue={editingBook.book.title} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-author" className="text-gray-300">Yazar *</Label>
                                <Input id="edit-author" name="author" required defaultValue={editingBook.book.author} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-coverImage" className="text-gray-300">Kapak Görseli URL</Label>
                                <Input id="edit-coverImage" name="coverImage" type="url" defaultValue={editingBook.book.coverImage || ""} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-genre" className="text-gray-300">Tür</Label>
                                <Input id="edit-genre" name="genre" defaultValue={editingBook.book.genre || ""} className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Durum</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                                        {statusOptions.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="text-white hover:bg-white/10 focus:bg-white/10"
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 text-gray-300 data-[state=active]:text-white hover:text-white">Tümü</TabsTrigger>
                    <TabsTrigger value="reading" className="data-[state=active]:bg-blue-600 text-gray-300 data-[state=active]:text-white hover:text-white">Okunuyor</TabsTrigger>
                    <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 text-gray-300 data-[state=active]:text-white hover:text-white">Okundu</TabsTrigger>
                    <TabsTrigger value="wishlist" className="data-[state=active]:bg-purple-600 text-gray-300 data-[state=active]:text-white hover:text-white">İstek Listesi</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <MediaGrid
                        items={mediaItems}
                        onStatusChange={handleStatusChange}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        emptyMessage="Henüz kitap eklenmemiş"
                    />
                </TabsContent>
            </Tabs>
        </AnimatedPage>
    );
}
