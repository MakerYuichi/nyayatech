import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

async function test() {
  const { data, error } = await supabase
    .from("test")
    .select("*")
    .limit(1)

  console.log({ data, error })
}

test()