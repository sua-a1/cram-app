-- Create knowledge documents table
CREATE TABLE public.knowledge_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    file_url text,
    file_type text,
    is_public boolean DEFAULT false,
    created_by uuid REFERENCES public.profiles(user_id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create knowledge categories table
CREATE TABLE public.knowledge_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create junction table for document categories
CREATE TABLE public.knowledge_document_categories (
    document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.knowledge_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, category_id)
);

-- Enable RLS
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_document_categories ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_knowledge_documents_org_id ON public.knowledge_documents(org_id);
CREATE INDEX idx_knowledge_documents_created_by ON public.knowledge_documents(created_by);
CREATE INDEX idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX idx_knowledge_categories_org_id ON public.knowledge_categories(org_id);

-- Auto-update updated_at columns
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.knowledge_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.knowledge_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for knowledge_documents

-- Admins have full access to their organization's documents
CREATE POLICY "Admins have full access to org documents"
    ON public.knowledge_documents
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.org_id = knowledge_documents.org_id
            AND profiles.role = 'admin'
        )
    );

-- Employees can view all documents in their organization
CREATE POLICY "Employees can view org documents"
    ON public.knowledge_documents
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.org_id = knowledge_documents.org_id
            AND profiles.role = 'employee'
        )
    );

-- Customers can only view public published documents
CREATE POLICY "Customers can view public published documents"
    ON public.knowledge_documents
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        is_public = true
        AND status = 'published'
    );

-- RLS Policies for knowledge_categories

-- Admins have full access to their organization's categories
CREATE POLICY "Admins have full access to org categories"
    ON public.knowledge_categories
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.org_id = knowledge_categories.org_id
            AND profiles.role = 'admin'
        )
    );

-- Employees can view categories in their organization
CREATE POLICY "Employees can view org categories"
    ON public.knowledge_categories
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.org_id = knowledge_categories.org_id
            AND profiles.role = 'employee'
        )
    );

-- RLS Policies for knowledge_document_categories

-- Admins have full access to document-category relationships
CREATE POLICY "Admins have full access to document categories"
    ON public.knowledge_document_categories
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.knowledge_documents d ON d.org_id = p.org_id
            WHERE p.user_id = auth.uid()
            AND p.role = 'admin'
            AND d.id = knowledge_document_categories.document_id
        )
    );

-- Employees and customers can view document-category relationships
CREATE POLICY "Users can view document categories"
    ON public.knowledge_document_categories
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.knowledge_documents d
            WHERE d.id = knowledge_document_categories.document_id
            AND (
                -- For public published documents
                (d.is_public = true AND d.status = 'published')
                OR
                -- For org members
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.user_id = auth.uid()
                    AND p.org_id = d.org_id
                    AND p.role IN ('admin', 'employee')
                )
            )
        )
    );

-- Grant access to authenticated users
GRANT ALL ON public.knowledge_documents TO authenticated;
GRANT ALL ON public.knowledge_categories TO authenticated;
GRANT ALL ON public.knowledge_document_categories TO authenticated; 