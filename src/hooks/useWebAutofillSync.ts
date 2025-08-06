import { useEffect, useRef } from "react";

type AutofillField = {
  inputId: string;
  setter: (val: string) => void;
};

type UseWebAutofillSyncProps = {
  email?: AutofillField;
  password?: AutofillField;
};

export function useWebAutofillSync({ email, password }: UseWebAutofillSyncProps) {
  const initializedRef = useRef({ email: false, password: false });

  useEffect(() => {
    const syncInput = (field: AutofillField | undefined, key: "email" | "password") => {
      if (!field || initializedRef.current[key]) return;

      const el = document.getElementById(field.inputId) as HTMLInputElement;
      if (!el) return;

      // Trigger browser autofill (Chrome-specific quirk)
      el.focus();
      el.blur();

      setTimeout(() => {
        if (el.value && !initializedRef.current[key]) {
          field.setter(el.value);
          initializedRef.current[key] = true;
        }
      }, 200);
    };

    syncInput(email, "email");
    syncInput(password, "password");

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (email?.inputId === target.id) {
        email.setter(target.value);
        initializedRef.current.email = true;
      }
      if (password?.inputId === target.id) {
        password.setter(target.value);
        initializedRef.current.password = true;
      }
    };

    document.addEventListener("input", handleInput);
    return () => {
      document.removeEventListener("input", handleInput);
    };
  }, [email, password]);
}